#!/usr/bin/env bash
set -euo pipefail

CONFIG="${1:-infra/route53/latency-routing.json}"
UNREADY="$(jq -r '[.regions[] | select(.ready != true)] | length' "$CONFIG")"
if [[ "$UNREADY" != "0" ]]; then
  jq -r '.regions[] | select(.ready != true) | "\(.region): \(.reason)"' "$CONFIG" >&2
  echo "Latency routing was not changed; every destination must have a verified runtime ALB and TLS certificate." >&2
  exit 1
fi

DOMAIN="$(jq -r '.domain' "$CONFIG")"
ZONE_ID="$(jq -r '.hostedZoneId' "$CONFIG")"
REGIONS="$(jq -c '.regions' "$CONFIG")"

while IFS=$'\t' read -r region load_balancer target_group dns_name hosted_zone certificate; do
  details="$(aws elbv2 describe-load-balancers \
    --load-balancer-arns "$load_balancer" \
    --region "$region" \
    --query 'LoadBalancers[0].[DNSName,CanonicalHostedZoneId,Scheme,State.Code]' \
    --output text)"
  read -r actual_dns actual_zone scheme state <<< "$details"
  if [[ "$actual_dns" != "$dns_name" || "$actual_zone" != "$hosted_zone" || "$scheme" != "internet-facing" || "$state" != "active" ]]; then
    echo "ALB '$load_balancer' in $region does not match the configured public DNS target." >&2
    exit 1
  fi

  cert_details="$(aws acm describe-certificate \
    --certificate-arn "$certificate" \
    --region "$region" \
    --query 'Certificate.[Status,DomainName]' \
    --output text)"
  read -r cert_status cert_domain <<< "$cert_details"
  if [[ "$cert_status" != "ISSUED" || "$cert_domain" != "$DOMAIN" ]]; then
    echo "Certificate '$certificate' in $region is not issued for '$DOMAIN'." >&2
    exit 1
  fi

  aws elbv2 describe-listeners \
    --load-balancer-arn "$load_balancer" \
    --region "$region" \
    --output json |
    jq -e --arg certificate "$certificate" \
      'any(.Listeners[].Certificates[]?; .CertificateArn == $certificate)' >/dev/null || {
      echo "Certificate '$certificate' is not attached to ALB '$load_balancer' in $region." >&2
      exit 1
    }

  aws elbv2 describe-target-health \
    --target-group-arn "$target_group" \
    --region "$region" \
    --output json |
    jq -e '.TargetHealthDescriptions | length > 0 and all(.[]; .TargetHealth.State == "healthy")' >/dev/null || {
      echo "Target group '$target_group' has no healthy targets in $region." >&2
      exit 1
    }
done < <(
  jq -r '.[] | [.region, .loadBalancerArn, .targetGroupArn, .dnsName, .hostedZoneId, .certificateArn] | @tsv' \
    <<< "$REGIONS"
)

existing_records="$(aws route53 list-resource-record-sets \
  --hosted-zone-id "$ZONE_ID" \
  --output json |
  jq --arg name "${DOMAIN}." \
    '[.ResourceRecordSets[] | select(.Name == $name and .Type == "A" and (has("SetIdentifier") | not))]')"
change_batch="$(jq -n \
  --arg name "${DOMAIN}." \
  --argjson existing "$existing_records" \
  --argjson regions "$REGIONS" \
  '{
    Changes: (
      ($existing | map({Action:"DELETE",ResourceRecordSet:.}))
      +
      ($regions | map({
        Action:"UPSERT",
        ResourceRecordSet:{
          Name:$name,
          Type:"A",
          SetIdentifier:.region,
          Region:.region,
          AliasTarget:{
            HostedZoneId:.hostedZoneId,
            DNSName:.dnsName,
            EvaluateTargetHealth:true
          }
        }
      }))
    )
  }')"
change_file="$(mktemp)"
trap 'rm -f "$change_file"' EXIT
printf '%s\n' "$change_batch" > "$change_file"

aws route53 change-resource-record-sets \
  --hosted-zone-id "$ZONE_ID" \
  --change-batch "file://$change_file"
