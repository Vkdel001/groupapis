const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000; // Use the PORT environment variable

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello CG');
});

app.post('/run-sequential-apis', async (req, res) => {
    try {
        // Step 1: Authenticate and get session ID
        const authResponse = await axios.post('https://esm.emtel.com/cgrestapi/api/authenticate/user', {
            username: ' ',
            password: ' '
        });

        const sessionId = authResponse.data.sessionId;
        console.log('Session ID:', sessionId);

        // Step 2: Creating a new Incident ticket using session ID from step 1
        const incidentResponse = await axios.post('https://esm.emtel.com/cgrestapi/api/incidentrequest', {
            Summary: req.body.Summary, // to be picked from clappia field
            Urgency: req.body.Urgency,
            Priority: req.body.Priority,
            Impact: req.body.Impact,
            HistoryRecords: [
                {
                    Action: req.body.Action, // to be picked from clappia field 
                    Comment: req.body.Comment // to be picked from clappia field
                }
            ]
        }, {
            headers: {
                sessionid: sessionId,
                'Content-Type': 'application/json'
            }
        });

        console.log('Incident Response:', incidentResponse.data.ID);         
        const itemIDPIT = incidentResponse.data.ID;  // This is the internal id for incident created

        // Step 3: Fetching the incident number IR from internal id created in step 2
        const itemResponse = await axios.get(`https://esm.emtel.com/cgrestapi/api/entity/incidentrequest/${itemIDPIT}?columns=EmailPIT&columns=DueDate`, {
            headers: {
                sessionid: sessionId
            }
        });

        console.log('Item Response:', itemResponse.data[0].ItemIDPIT); // This is the value of IR-00xxxxx 

        // Return the final response
        res.json({
            sessionId: sessionId,
            incidentId: itemIDPIT,
            itemResponse: itemResponse.data[0].ItemIDPIT
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({
            error: error.response ? error.response.data : error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
