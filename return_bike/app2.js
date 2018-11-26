
var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB();
var response = { // for API gateway integration this type of response is required.
        	"statusCode": 200,
        	"headers": {
            		"my_header": "my_value"
        	},
        	"body": "OK",
        	"isBase64Encoded": false
    	};;


// assumed pickup and drop off locations are same
exports.rbikeHandler = (event, context, callback) => {
    	var location = event.queryStringParameters.Location;
    	var userid = event.queryStringParameters.Userid;
		var bikeid = event.queryStringParameters.BikeId;
    	console.log("input locationid:"+location+",user:"+userid+",bikeid:"+bikeid);

	if(location == undefined || userid == undefined || bikeid == undefined) {
		console.log("Location,Userid and BikeId are required");
		response.body = "Location,Userid and BikeId are required";
		callback(null,response);
    	}


	if(updateBikeRides(bikeid,location,userid)&&
	updateBikeLocations(bikeid,location,userid))
           callback(null,response);
     else {
		response.body = "Error in updating tables, check input";
           callback(null,response);
	}
         
};


// Need to drop existing row and inserting a new row when drop and pick locations are not same.

function updateBikeLocations( bikeid,locationid,userid) 
{
       var updateqry = {
            TableName: "bikelocations",
            ExpressionAttributeValues:{":a3":{"N":"0"},":a4":{"N":"1"}},
            Key: { "LocationId":{"S":locationid},"BikeId":{"S":bikeid}},
            UpdateExpression: "Set #Stts = :a3",
            ExpressionAttributeNames: { "#Stts": "Status"},
            ConditionExpression: "#Stts = :a4"
     };
     
    console.log("Attempting a conditional update...");
    docClient.updateItem(updateqry, function(err, data) {
        if (err) {
            console.error("Unable to update bikelocations. Error JSON:", 			JSON.stringify(err, null, 2));
		return false;
        } else {
            console.log("Update Bikelocations succeeded:", 						JSON.stringify(data, null, 2));
        }
    });
	return true;
}

function updateBikeRides(bikeid,locationid,userid)
{
    var curdate = new Date().toString();
    var params = {
            TableName: "bikerides",
            Key: {"UserId":{"S":userid},"BikeId":{"S":bikeid}},
		    UpdateExpression: "Set #dl = :a1, #dt = :a2",
            ExpressionAttributeNames:{"#dl":"droplocation","#dt":"droptime"},
            ExpressionAttributeValues:{":a1":{"S":locationid},":a2":{"S":curdate}}
    };
    
    docClient.updateItem(params, function(err, data) {
        if (err) {
            console.error("Unable to update bikerides. Error JSON:", JSON.stringify(err, null, 2));
		return false;
        } else {
            console.log("Updated bikerides:", JSON.stringify(data, null, 2));
        }
    });
	return true;
}