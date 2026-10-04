#!/bin/bash

curl -i \
  -H "x-owner-id: owner_123" \
  http://<ALB-DNS>/engine/worldgraph/ping
