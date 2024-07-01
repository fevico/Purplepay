const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: "Swagger Documentation For Purple pay",
            version: "1.0.0",
            description: "API for managing Purple pay",
        },
        servers:[
            {
                url: "http://localhost:2000/",
                description: "Local server",
            }
        ],
        components:{
            schemas:{
                Users:{
                    type: "object",
                    required: ["email", "password"],
                    properties:{
                        firstName:{ 
                            type: "string",
                            format: "name",
                            default: "John",
                            description: "User's first name"
                        },
                        password:{
                            type: "string",
                            format: "password",
                            description: "User's password",
                            default: "examplePassword"
                        },
                    }
                },
                wallet:{
                    type: "object",
                    required: ["email", "bvn", "firstName", "lastName", "phoneNumber", "address", "dateOfBirth"],
                    properties:{
                        firstName:{ 
                            type: "string",
                            format: "name",
                            default: "John",
                            description: "wallet first name"
                        },
                        lastName:{
                            type: "string",
                            format: "password",
                            description: "wallet last name",
                            default: "Doe"
                        },
                        email:{
                            type: "string",
                            format: "email",
                            description: "wallet email",
                            default: "example@gmail.com"
                        },
                        phoneNumber:{
                            type: "string",
                            format: "phone",
                            description: "wallet phone number",
                            default: "08012345678"
                        },
                        bvn:{
                            type: "string",
                            format: "bvn",
                            description: "user valid bvn",
                            default: "12345678901"
                        },
                        address:{
                            type: "string",
                            format: "address",
                            description: "user address",
                            default: "123, abc street, abc city, abc state"
                        },
                        dateOfBirth:{
                            type: "string",
                            format: "date",
                            description: "user date of birth",
                            default: "1990-01-01"
                        },
                    }
                },

                utilityBills:{
                    type: "object",
                    required: ["subscriberAccountNumber", "amount", "billerId"],
                    properties:{
                        subscriberAccountNumber:{ 
                            type: "string",
                            format: "name",
                            default: "04223568280",
                            description: "Subcriber account number"
                        },
                        amount:{
                            type: "string",
                            format: "name",
                            description: "amount to subcribe",
                            default: "100"
                        },
                        billerId:{
                            type: "string",
                            format: "name",
                            description: "biller id to be subcribe to",
                            default: "5"
                        },
                    }
                },
                billsPayment:{
                    type: "object",
                    required: ["service_name", "amount", "phone", "variation_code", "service_id"],
                    properties:{
                        service_name:{ 
                            type: "string",
                            format: "name",
                            default: "MTN Data",
                            description: "Network or service to pay"
                        },
                        amount:{
                            type: "string",
                            format: "name",
                            description: "amount to subcribe",
                            default: "100"
                        },
                        phone:{
                            type: "string",
                            format: "name",
                            description: "Phone number to recharge or subscribe",
                            default: "09070676543"
                        },
                        variation_code:{
                            type: "string",
                            format: "name",
                            description: "code to purchase or subscribe",
                            default: "mtn-10mb-100"
                        },
                        service_id:{
                            type: "string",
                            format: "name",
                            description: "Network to subscribe to",
                            default: "mtn-data"
                        },
                    }
                },
            },
            responses:{
                200:{
                    description: "Success",
                    content: "application/json"
                },
                400:{
                    description: "Bad Request",
                    content: "application/json"
                },
                404:{
                    description: "Request Not Found",
                    content: "application/json"
                },
                403:{
                    description: "Unauthorized Request",
                    content: "application/json"
                },
                422:{
                    description: "Unprocessed Request user already exists",
                    content: "application/json"
                },
                500:{
                    description: "Internal Server Error",
                    content: "application/json"
                }
            },
            securitySchemes: {
                ApiKeyAuth:{
                    type: "apikey",
                    in: "header",
                    name: "Authorization",
                }
            }
        },
        security:[{
            ApiKeyAuth:[],
        }]
    },
    apis:[ 
        "./src/routes/auth.ts",
        "./src/routes/wallet.ts",
        "./src/routes/utilityBills.ts",
        "./src/routes/billsPayment.ts",
   ]
};

export default options;
