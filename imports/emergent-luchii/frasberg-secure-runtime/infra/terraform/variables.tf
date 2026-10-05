variable "aws_region" {
  description = "AWS region for the Frasberg ECS mesh"
  type        = string
  default     = "us-east-1"
}

variable "vpc_name" {
  description = "VPC name that contains the Frasberg runtime hosts"
  type        = string
  default     = "frasberg-vpc"
}

variable "private_subnet_names" {
  description = "Private compute subnet names used by the ECS mesh"
  type        = list(string)
  default     = ["private-compute-a", "private-compute-b"]
}

variable "cluster_name" {
  description = "Existing ECS cluster name"
  type        = string
  default     = "frasberg-secure-runtime-cluster"
}

variable "services" {
  description = "Runtime mesh service names"
  type        = list(string)
  default = [
    "auth", "compute", "core", "data", "queue", "cache", "search", "events", "notify",
    "billing", "identity", "profile", "preferences", "sessions", "state", "presence",
    "activity", "history", "timeline", "feed", "stream", "sync", "merge", "aggregate",
    "reduce", "fold", "compress", "pack", "bundle", "wrap", "seal", "finalize",
    "deliver", "dispatch", "route", "relay", "transmit", "broadcast", "multicast",
    "fanout", "spread", "diffuse", "propagate", "radiate", "beam", "pulse", "wave",
    "ripple", "echo", "resonate", "amplify", "boost", "surge", "flare", "flash"
  ]
}

variable "container_image" {
  description = "ECR or registry image used by each task definition"
  type        = string
  default     = "luchii-games/frasberg-secure-runtime:latest"
}

variable "execution_role_arn" {
  description = "ECS task execution role ARN"
  type        = string
}

variable "task_role_arn" {
  description = "Frasberg ECS task role ARN"
  type        = string
}
