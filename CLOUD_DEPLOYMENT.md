# ☁️ Frasberg v1.0.0 - Cloud Deployment Guide

Complete deployment guides for AWS, GCP, and Azure.

---

## 🟠 AWS DEPLOYMENT

### Option A: AWS ECS (Elastic Container Service)

**1. Create ECS Cluster:**
```bash
aws ecs create-cluster --cluster-name frasberg-prod
```

**2. Register Task Definitions:**
```bash
# Canonical Core
aws ecs register-task-definition --cli-input-json file://aws/canonical-core-task.json

# Education Fork
aws ecs register-task-definition --cli-input-json file://aws/education-fork-task.json

# Healthcare Fork
aws ecs register-task-definition --cli-input-json file://aws/healthcare-fork-task.json

# Analytics
aws ecs register-task-definition --cli-input-json file://aws/analytics-task.json
```

**3. Create Services:**
```bash
aws ecs create-service \
  --cluster frasberg-prod \
  --service-name canonical-core \
  --task-definition canonical-core:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

**Cost Estimate:** ~$70/month (ECS Fargate + ALB)

### Option B: AWS EC2 with Docker

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.large \
  --key-name your-key \
  --security-group-ids sg-xxx \
  --user-data file://aws/user-data.sh

# SSH and deploy
ssh -i your-key.pem ec2-user@<instance-ip>
git clone https://github.com/FrasbergAI/frasberg
cd frasberg
cd deploy/canonical-core && docker-compose up -d
cd ../forks/education && docker-compose up -d
cd ../healthcare-nonclinical && docker-compose up -d
cd ../../analytics && docker-compose up -d
```

---

## 🔵 GCP DEPLOYMENT

### Option A: Google Cloud Run

**1. Build and Push Images:**
```bash
# Configure gcloud
gcloud config set project frasberg-prod

# Build images
gcloud builds submit --tag gcr.io/frasberg-prod/canonical-core:v1 deploy/canonical-core
gcloud builds submit --tag gcr.io/frasberg-prod/education-fork:v1 deploy/forks/education
gcloud builds submit --tag gcr.io/frasberg-prod/healthcare-fork:v1 deploy/forks/healthcare-nonclinical
gcloud builds submit --tag gcr.io/frasberg-prod/analytics:v1 deploy/analytics
```

**2. Deploy to Cloud Run:**
```bash
# Canonical Core
gcloud run deploy canonical-core \
  --image gcr.io/frasberg-prod/canonical-core:v1 \
  --port 8000 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --cpu 1 \
  --memory 1Gi

# Education Fork
gcloud run deploy education-fork \
  --image gcr.io/frasberg-prod/education-fork:v1 \
  --port 8001 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Healthcare Fork
gcloud run deploy healthcare-fork \
  --image gcr.io/frasberg-prod/healthcare-fork:v1 \
  --port 8002 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Analytics
gcloud run deploy analytics \
  --image gcr.io/frasberg-prod/analytics:v1 \
  --port 5000 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Cost Estimate:** ~$30/month (Cloud Run with minimal traffic)

---

## 🔷 AZURE DEPLOYMENT

### Option A: Azure Container Instances

**1. Create Resource Group:**
```bash
az group create --name frasberg-rg --location eastus
```

**2. Deploy Containers:**
```bash
# Canonical Core
az container create \
  --resource-group frasberg-rg \
  --name canonical-core \
  --image <your-registry>/canonical-core:v1 \
  --dns-name-label frasberg-canonical \
  --ports 8000 \
  --cpu 1 \
  --memory 1

# Education Fork
az container create \
  --resource-group frasberg-rg \
  --name education-fork \
  --image <your-registry>/education-fork:v1 \
  --dns-name-label frasberg-education \
  --ports 8001

# Healthcare Fork
az container create \
  --resource-group frasberg-rg \
  --name healthcare-fork \
  --image <your-registry>/healthcare-fork:v1 \
  --dns-name-label frasberg-healthcare \
  --ports 8002

# Analytics
az container create \
  --resource-group frasberg-rg \
  --name analytics \
  --image <your-registry>/analytics:v1 \
  --dns-name-label frasberg-analytics \
  --ports 5000
```

**Cost Estimate:** ~$40/month (Container Instances)

---

## 🌍 KUBERNETES DEPLOYMENT (Any Cloud)

### Complete Kubernetes Manifests

**1. Create Namespace:**
```yaml
# kubernetes/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: frasberg
```

**2. Canonical Core Deployment:**
```yaml
# kubernetes/canonical-core.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: canonical-core
  namespace: frasberg
spec:
  replicas: 2
  selector:
    matchLabels:
      app: canonical-core
  template:
    metadata:
      labels:
        app: canonical-core
    spec:
      containers:
      - name: canonical-core
        image: frasberg/canonical-core:v1
        ports:
        - containerPort: 8000
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 3
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: canonical-core-service
  namespace: frasberg
spec:
  selector:
    app: canonical-core
  ports:
  - protocol: TCP
    port: 8000
    targetPort: 8000
  type: LoadBalancer
```

**3. Apply Deployments:**
```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/canonical-core.yaml
kubectl apply -f kubernetes/education-fork.yaml
kubectl apply -f kubernetes/healthcare-fork.yaml
kubectl apply -f kubernetes/analytics.yaml
```

---

## 🔒 SECURITY BEST PRACTICES

### SSL/TLS Certificates

**Let's Encrypt:**
```bash
certbot certonly --standalone -d frasberg.yourdomain.com
```

**Cloud Provider Managed:**
- AWS: ACM (AWS Certificate Manager)
- GCP: Google-managed SSL certificates
- Azure: App Service Managed Certificates

### Secrets Management

**AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name frasberg/api-keys \
  --secret-string file://secrets.json
```

**GCP Secret Manager:**
```bash
echo -n "my-secret" | gcloud secrets create api-key --data-file=-
```

**Azure Key Vault:**
```bash
az keyvault secret set \
  --vault-name frasberg-vault \
  --name api-key \
  --value "xxx"
```

---

## 📊 MONITORING & LOGGING

### AWS CloudWatch
```bash
aws logs create-log-group --log-group-name /ecs/frasberg
aws logs put-retention-policy --log-group-name /ecs/frasberg --retention-in-days 30
```

### GCP Cloud Logging
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=canonical-core"
```

### Azure Monitor
```bash
az monitor app-insights component create \
  --app frasberg-ai-insights \
  --location eastus \
  --resource-group frasberg-rg
```

---

## 💰 COST COMPARISON

| Provider | Minimal Setup | Standard Setup | High Availability |
|----------|--------------|----------------|-------------------|
| **AWS**  | $50/month    | $150/month     | $500/month        |
| **GCP**  | $30/month    | $120/month     | $400/month        |
| **Azure**| $40/month    | $140/month     | $450/month        |

### Cost Breakdown (Minimal Setup)

**AWS:**
- ECS Fargate (5 tasks × 0.5 vCPU × 1GB): ~$35/month
- Application Load Balancer: ~$15/month

**GCP:**
- Cloud Run (5 services, minimal traffic): ~$25/month
- Cloud Load Balancing: ~$5/month

**Azure:**
- Container Instances (5 containers): ~$30/month
- Application Gateway: ~$10/month

---

## 🚀 QUICK DEPLOY COMMANDS

### Deploy to AWS ECS
```bash
./cloud-deploy/aws-ecs-deploy.sh
```

### Deploy to GCP Cloud Run
```bash
./cloud-deploy/gcp-cloudrun-deploy.sh
```

### Deploy to Azure Container Instances
```bash
./cloud-deploy/azure-aci-deploy.sh
```

### Deploy to Kubernetes (any cloud)
```bash
./cloud-deploy/kubernetes-deploy.sh
```

---

## 🌐 DOMAIN CONFIGURATION

### Custom Domain Setup

**AWS Route 53:**
```bash
aws route53 create-hosted-zone --name frasberg.com --caller-reference $(date +%s)
```

**GCP Cloud DNS:**
```bash
gcloud dns managed-zones create frasberg \
  --dns-name=frasberg.com \
  --description="Frasberg DNS zone"
```

**Azure DNS:**
```bash
az network dns zone create \
  --resource-group frasberg-rg \
  --name frasberg.com
```

---

## 📈 AUTO-SCALING CONFIGURATION

### AWS ECS Auto-Scaling
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/frasberg-ai-prod/canonical-core \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

### GCP Cloud Run Auto-Scaling
```bash
gcloud run services update canonical-core \
  --min-instances=1 \
  --max-instances=10 \
  --concurrency=80
```

### Kubernetes HPA
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: canonical-core-hpa
  namespace: frasberg
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: canonical-core
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] All services responding to health checks
- [ ] SSL/TLS certificates configured
- [ ] DNS records updated
- [ ] Monitoring and logging enabled
- [ ] Auto-scaling configured
- [ ] Backup strategy implemented
- [ ] Security groups/firewall rules configured
- [ ] Load balancer health checks passing
- [ ] API documentation accessible
- [ ] Frontend connected to backend services

---

**Choose your cloud provider and deploy Frasberg AI v1.0.0 globally!**

🌍 **Production-ready | Multi-cloud | Scalable | Secure**
