variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

variable "db_username" {
  sensitive = true
}

variable "db_password" {
  sensitive = true
}

variable "public_subnets" {
  type = list(string)
}
