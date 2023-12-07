# LieSense Checker (Backend)

Verifying Genuine Licenses in a Digital World.

This project is a part of classwork of CMPE281 (Cloud Technologies by Prof. [Sanjay Garje](https://www.linkedin.com/in/sanjaygarje/)) at [San Jose State University](https://www.sjsu.edu), California, USA.

Team Members:
-	Saharat Saengsawang
- Akanksha Vallabh Pingle
-	Tonja Jean
-	Sanjay Sathyarapu

![Screenshot of id matching record](https://github.com/saharatss-sjsu/CMPE281-P2-FrontEnd/blob/main/screenshots/Screenshot%202023-11-30%20at%204.19.02%E2%80%AFPM.jpg?raw=true)

## AWS Components

(Mandatory):
- Amazon Elastic Compute Cloud (EC2)
- Amazon Simple Storage Service (S3)
- Amazon Relational Database Service (RDS)

(Additional):
- Amazon Route 53
- Amazon Elastic Load Balancing (ELB)
- Amazon Auto Scaling Group
- Amazon Elastic Block Store (EBS)
- Amazon CloudFront
- Amazon Lambda
- Amazon Rekognition
- Amazon Virtual Private Cloud (VPC)
- Amazon Identity and Access Management (IAM)
- Amazon Certificate Manager (ACM)
 
## Installation

Software requirements:
- NodeJS v18.18.0
- npm serve v12.0.1

Or run the production setup script on linux environment:

```bash
#!/bin/bash

# This file is used for running in EC2 instance user data

sudo apt update
sudo apt upgrade -y

# Install necessary linux packages

sudo apt install -y unzip
sudo apt install -y nodejs
sudo apt install -y npm
sudo npm install -g serve@12.0.1

# Set environment variable for the workspace and file download path

export PROJECT_BASEPATH=/home/ubuntu
export PROJECT_DOWNLOAD=https://license-media.saharatss.org/server
export PROJECT_FILENAME=server_frontend_z0q5isqksYLPLYAyHT2o.zip
export PROJECT_SERVICE_NAME=cmpe281_frontend.service

# Unzip

cd $PROJECT_BASEPATH
wget $PROJECT_DOWNLOAD/$PROJECT_FILENAME
unzip $PROJECT_FILENAME
rm $PROJECT_FILENAME

cd build

# Create a script for running the server and define AWS S3 access credential

touch run.sh
echo "serve -s $PROJECT_BASEPATH/build -p 3000" > run.sh

# Copy the systemctl service script and Start the service

cp $PROJECT_SERVICE_NAME /etc/systemd/system/$PROJECT_SERVICE_NAME
sudo systemctl daemon-reload
sudo systemctl enable $PROJECT_SERVICE_NAME
sudo systemctl start $PROJECT_SERVICE_NAME

echo "Setup done!!"
```

In case of running the project locally, skip creating a script and start systemctl service, but run the command below directly within the project folder.

```bash
npm start
```

Also, change backend and cloudfront/s3 bucket urls in `{project_dir}/src/app.jsx` to connect to the specific backend host.

```
api.host_backend    = `http://localhost:8000`;
api.host_cloudfront = 'https://license-media.saharatss.org';
```