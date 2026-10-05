variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "ai-court"
}

variable "node_group_size" {
  description = "Number of nodes in the cluster"
  type        = number
  default     = 3
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.xlarge"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
