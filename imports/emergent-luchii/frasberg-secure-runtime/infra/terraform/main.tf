terraform {
  required_version = ">= 1.6.0"

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

locals {
  cluster_name = var.cluster_name
}

data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = [var.vpc_name]
  }
}

data "aws_subnet" "private_a" {
  filter {
    name   = "tag:Name"
    values = [var.private_subnet_names[0]]
  }
}

data "aws_subnet" "private_b" {
  filter {
    name   = "tag:Name"
    values = [var.private_subnet_names[1]]
  }
}

data "aws_ecs_cluster" "cluster" {
  cluster_name = local.cluster_name
}

resource "aws_security_group" "service" {
  for_each    = toset(var.services)
  name        = "frasberg-${each.value}-sg"
  description = "Security group for ${each.value} ECS service"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_task_definition" "service" {
  for_each                 = toset(var.services)
  family                   = "frasberg-${each.value}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  execution_role_arn = var.execution_role_arn
  task_role_arn      = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "frasberg-${each.value}-container"
      image     = var.container_image
      essential = true
      portMappings = [{
        containerPort = 4001
        protocol      = "tcp"
      }]
      environment = [
        { name = "SERVICE_NAME", value = each.value },
        { name = "SERVICE_URL", value = "https://${each.value}.aws.frasberg.com" },
        { name = "RUNTIME_ROUTER_HOST", value = "0.0.0.0" }
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "node -e \"fetch('http://localhost:4001/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))\""]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 10
      }
    }
  ])
}

data "aws_lb_target_group" "service" {
  for_each = toset(var.services)
  name     = "frasberg-${each.value}-tg"
}

resource "aws_ecs_service" "service" {
  for_each        = aws_ecs_task_definition.service
  name            = "frasberg-${each.key}-service"
  cluster         = data.aws_ecs_cluster.cluster.arn
  task_definition = each.value.arn
  launch_type     = "FARGATE"
  desired_count   = 2

  network_configuration {
    subnets          = [data.aws_subnet.private_a.id, data.aws_subnet.private_b.id]
    security_groups  = [aws_security_group.service[each.key].id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = data.aws_lb_target_group.service[each.key].arn
    container_name   = "frasberg-${each.key}-container"
    container_port   = 4001
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
}
