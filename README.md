# bikeshare-app

This is a sample template for bikeshare-app - Below is a brief explanation of what is there:

```bash
.
├── README.md                   <-- This instructions file
├── get_bike                 <-- Source code for a lambda function to get a bike
│   ├── app1.js                  <-- Lambda function code
│   ├── package.json            <-- NodeJS dependencies
├── return_bike                 <-- Source code for a lambda function to return a bike
│   ├── app2.js                  <-- Lambda function code
│   ├── package.json            <-- NodeJS dependencies│   
└── template.yaml               <-- SAM template for APIs
└── bikesharedata.yaml               <-- SAM template for DynamoDB tables
└── samplelocations.json               <-- Sample data for bikelocations table.

```

## Requirements

* AWS CLI already configured with Administrator permission
* [NodeJS 8.10+ installed](https://nodejs.org/en/download/)
* [Docker installed](https://www.docker.com/community-edition), 
* SAM CLI installed, for desktops with docker toolbox , please make sure 'SAM CLI, version 0.6.1' or higher.

## Setup process

### Installing dependencies

In this example we use `npm` but you can use `yarn` if you prefer to manage NodeJS dependencies:

```bash
cd get_bike
npm install
cd ../
cd return_bike
npm install
cd ../```

We need a `S3 bucket` where we can upload our Lambda functions packaged as ZIP before we deploy anything - If you don't have a S3 bucket to store code artifacts then this is a good time to create one:

```bash
aws s3 mb s3://BUCKET_NAME
```

## DynamoDB table creation and data population.
bikesharedata.yaml contains dynamodb table definitions. installing this is same as installing an app . follow the instructions below.
```bash
sam package \
    --template-file bikesharedata.yaml \
    --output-template-file cfdata.yaml \
    --s3-bucket REPLACE_THIS_WITH_YOUR_S3_BUCKET_NAME
```

Next, the following command will create a Cloudformation Stack, that should result in 3 tables (bikelocations, bikes, bikerides.

```bash
sam deploy \
    --template-file cfdata.yaml \
    --stack-name bikeshare-data \
    --capabilities CAPABILITY_IAM
    
## Load Sample data into bikelocations table
aws dynamodb batch-write-item --request-items file://samplelocations.json

### Local development

**Invoking function locally through local API Gateway**

```bash
sam local start-api
```

If the previous command ran successfully you should now be able to hit the following local endpoint to invoke your function `http://localhost:3000/Bike/book?Location="1,1"&Userid="testuser"`

**SAM CLI** is used to emulate both Lambda and API Gateway locally and uses our `template.yaml` to understand how to bootstrap this environment (runtime, where the source code is, etc.) - The following excerpt is what the CLI will read in order to initialize an API and its routes:

```yaml
...
Events:
    BookBike:
        Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
        Properties:
            Path: /Bike/book
            Method: post
            
Events:
    ReturnBike:
        Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
        Properties:
            Path: /Bike/return
            Method: post
```

## Packaging and deployment

AWS Lambda NodeJS runtime requires a flat folder with all dependencies including the application. SAM will use `CodeUri` property to know where to look up for both application and dependencies:

```yaml
...
    FirstFunction:
        Type: AWS::Serverless::Function
        Properties:
            CodeUri: get_bike/
            ...
    SecondFunction:
        Type: AWS::Serverless::Function
        Properties:
            CodeUri: return_bike/
            ...
```



Next, run the following command to package our Lambda function to S3:
**NOTE**:  This implementation exposes APIs without authentication, use it for testing purposes only and tear down your stack. Implement security for APIs for real world usage.

```bash
sam package \
    --template-file template.yaml \
    --output-template-file packaged.yaml \
    --s3-bucket REPLACE_THIS_WITH_YOUR_S3_BUCKET_NAME
```

Next, the following command will create a Cloudformation Stack and deploy your SAM resources.

```bash
sam deploy \
    --template-file packaged.yaml \
    --stack-name bikeshare-app \
    --capabilities CAPABILITY_IAM
```

## Remember to use the bucket created here while building the code pipeline during automation.

> **See [Serverless Application Model (SAM) HOWTO Guide](https://github.com/awslabs/serverless-application-model/blob/master/HOWTO.md) for more details in how to get started.**

After deployment is complete you can run the following command to retrieve the API Gateway Endpoint URL:

```bash
aws cloudformation describe-stacks \
    --stack-name bikeshare-app \
    --query 'Stacks[].Outputs'
``` 

## Testing
Not Implemented yet.


# Appendix

## AWS CLI commands

AWS CLI commands to package, deploy and describe outputs defined within the cloudformation stack:

```bash
sam package \
    --template-file template.yaml \
    --output-template-file packaged.yaml \
    --s3-bucket REPLACE_THIS_WITH_YOUR_S3_BUCKET_NAME

sam deploy \
    --template-file packaged.yaml \
    --stack-name sam-app \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides MyParameterSample=MySampleValue

aws cloudformation describe-stacks \
    --stack-name bikeshare-app --query 'Stacks[].Outputs'
```

**NOTE**: Alternatively this could be part of package.json scripts section.

## Bringing to the next level

This implementation is basic, primarily addressing services and backend storage.
Here are a few ideas that you can use to extend further

* Use Cognito to manage users and secure API.
* Use AWS Amplify to build front end.
* Extend app features to include features like user registration, payment set up ..etc.

Next, you can use the following resources to know more about beyond hello world samples and how others structure their Serverless applications:

* [AWS Serverless Application Repository](https://aws.amazon.com/serverless/serverlessrepo/)
