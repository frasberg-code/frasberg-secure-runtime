# Frasberg AI AWS Infrastructure

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ECS Cluster
resource "aws_ecs_cluster" "frasberg_ai" {
  name = "frasberg-ai-production"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECR Repositories
resource "aws_ecr_repository" "canonical_core" {
  name                 = "frasberg-ai/canonical"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
}

# Load Balancer
resource "aws_lb" "frasberg_ai" {
  name               = "frasberg-ai-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnets
}

# RDS Database
resource "aws_db_instance" "frasberg_ai" {
  identifier           = "frasberg-ai-db"
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t3.medium"
  allocated_storage   = 100
  storage_encrypted   = true
  
  db_name  = "frasberg_ai"
  username = var.db_username
  password = var.db_password
  
  backup_retention_period = 7
  multi_az               = true
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "frasberg_ai" {
  cluster_id           = "frasberg-ai-cache"
  engine               = "redis"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

# S3 for static assets
resource "aws_s3_bucket" "frasberg_ai_assets" {
  bucket = "frasberg-ai-assets-${var.environment}"
}

output "alb_dns_name" {
  value = aws_lb.frasberg_ai.dns_name
}
