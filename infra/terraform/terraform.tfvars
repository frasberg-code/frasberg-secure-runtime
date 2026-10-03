aws_region = "us-east-1"
vpc_name   = "frasberg-vpc"
private_subnet_names = ["private-compute-a", "private-compute-b"]
cluster_name = "frasberg-secure-runtime-cluster"
container_image = "303004020510.dkr.ecr.us-east-1.amazonaws.com/frasberg-secure-runtime:latest"
execution_role_arn = "arn:aws:iam::303004020510:role/ecsTaskExecutionRole"
task_role_arn      = "arn:aws:iam::303004020510:role/frasberg-runtime-role"
