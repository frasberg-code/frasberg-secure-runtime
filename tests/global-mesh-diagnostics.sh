#!/bin/bash

echo "West Region"
curl -i http://<ALB-WEST>/health

echo "East Region"
curl -i http://<ALB-EAST>/health

echo "EU Region"
curl -i http://<ALB-EU>/health
