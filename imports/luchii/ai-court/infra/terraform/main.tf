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

module "court_us_west" {
  source = "./modules/k8s_cluster"
  region = "us-west-2"
  name   = "ai-court-us-west"
  environment = "production"
}

module "court_us_east" {
  source = "./modules/k8s_cluster"
  region = "us-east-1"
  name   = "ai-court-us-east"
  environment = "production"
}

module "court_eu_central" {
  source = "./modules/k8s_cluster"
  region = "eu-central-1"
  name   = "ai-court-eu-central"
  environment = "production"
}

output "us_west_cluster" {
  value = module.court_us_west.cluster_id
}

output "us_east_cluster" {
  value = module.court_us_east.cluster_id
}

output "eu_cluster" {
  value = module.court_eu_central.cluster_id
}
