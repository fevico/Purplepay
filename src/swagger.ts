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
                url: "http://localhost:9876/",
                description: "Local server",
            }
        ],
        components:{
            schemas:{
                Users:{
                    type: "object",
                    required: ["email", "password"],
                    properties:{
                        email:{ 
                            type: "string",
                            format: "name",
                            default: "example@example.com",
                            description: "User's email"
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

                moneyTransfer:{
                    type: "object",
                    required: ["bank_code", "amount", "account_number", "narration", "name_enquiry_reference"],
                    properties:{
                        bank_code:{ 
                            type: "string",
                            format: "name",
                            default: "000004",
                            description: "Bank code for each bank"
                        },
                        amount:{
                            type: "string",
                            format: "name",
                            description: "amount to transfer",
                            default: "100"
                        },
                        account_number:{
                            type: "string",
                            format: "name",
                            description: "Account Number to transfer to",
                            default: "2108334757"
                        },
                        narration:{
                            type: "string",
                            format: "name",
                            description: "money description",
                            default: "school fees"
                        },
                        name_enquiry_reference:{
                            type: "string",
                            format: "name",
                            description: "sessionId from get acount name",
                            default: "090286240704083544873401308920"
                        },
                    }
                },
                giftCard:{
                    type: "object",
                    required: ["productId", "quantity", "unitPrice", "senderName", "recipientEmail"],
                    properties:{
                        productId:{ 
                            type: "string",
                            format: "name",
                            default: "10",
                            description: "product id for each gift card"
                        },
                        quantity:{
                            type: "string",
                            format: "name",
                            description: "number of gift cards to purchase",
                            default: "1"
                        },
                        unitPrice:{
                            type: "string",
                            format: "name",
                            description: "price of each gift card",
                            default: "1000"
                        },
                        senderName:{
                            type: "string",
                            format: "name",
                            description: "name of the sender",
                            default: "John Doe"
                        },
                        recipientEmail:{
                            type: "string",
                            format: "name",
                            description: "email of the recipient",
                            default: "example@gmail.com"
                        },
                    }
                },
                virtualCard:{
                    type: "object",
                    required: ["firstName", "lastName", "customerEmail", "houseNumber", "phoneNumber", "dateOfBirth", "idImage", "userPhoto", "line1"],
                    properties:{
                        firstName:{ 
                            type: "string",
                            format: "name",
                            default: "John",
                            description: "First name of the card owner"
                        },
                        lastName:{
                            type: "string",
                            format: "name",
                            description: "First name of the card owner",
                            default: "Doe"
                        },
                        houseNumber:{
                            type: "string",
                            format: "name",
                            description: "House number of the card owner",
                            default: "lekki"
                        },
                        customerEmail:{
                            type: "string",
                            format: "name",
                            description: "Email of card owner",
                            default: "school fees"
                        },
                        idNumber:{
                            type: "string",
                            format: "name",
                            description: "sessionId from get acount name",
                            default: "090286240704083544873401308920"
                        },
                        phoneNumber:{
                            type: "string",
                            format: "name",
                            description: "sessionId from get acount name",
                            default: "090286240704083544873401308920"
                        },
                        dateOfBirth:{
                            type: "string",
                            format: "name",
                            description: "sessionId from get acount name",
                            default: "090286240704083544873401308920"
                        },
                        idImage:{
                            type: "string",
                            format: "name",
                            description: "sessionId from get acount name",
                            default: "090286240704083544873401308920"
                        },
                        line1:{
                            type: "string",
                            format: "name",
                            description: "sessionId from get acount name",
                            default: "090286240704083544873401308920"
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
        "./src/routes/moneyTransfer.ts",
        "./src/routes/giftCard.ts",
        "./src/routes/virtualCard.ts.ts",
   ]
};

export default options;
