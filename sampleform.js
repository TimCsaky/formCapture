/**
 * sampleform.js - JavaScript logic for the sample form
 * Includes functionality from both sampleform.html and ajaxsample.html
 */

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');            
    
    // Initialize FormCapture with custom configuration
    if (typeof FormCapture !== 'undefined') {
        FormCapture.init({
            captureOnLoad: true,
            captureOnChange: true,
            onCapture: function(formsData) {
                // We get an array of form data, get the first one since we only have one form
                const formData = formsData[0];
                
                // Display captured data in the output div
                const outputElement = document.getElementById('outputData');
                if (outputElement) {
                    outputElement.textContent = JSON.stringify(formData, null, 2);
                }
                
                // Also log to console as requested
                console.log('Form data captured:', formData);
            }
        });
    }
    
    // Add event listeners to form fields
    function setupFieldListeners() {
        const formFields = document.querySelectorAll('input, select');
        formFields.forEach(field => {
            // Log when typing finishes (field loses focus) and send data to API
            field.addEventListener('blur', function() {
                console.log(`User finished typing in field: ${field.name || field.id}`);
                
                // Get all form data and send to API when any field loses focus
                sendFormDataToApi();
            });
        });
    }
    
    // Function to collect form data and send to API
    function sendFormDataToApi() {
        const form = document.getElementById("sampleForm") || document.querySelector('form');
        if (!form) return;
        
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Update response message element if it exists
        const responseMessage = document.getElementById("responseMessage");
        if (responseMessage) {
            responseMessage.innerText = "Sending data...";
        }
        
        // Send request to remote server
        const params = new URLSearchParams(data).toString();
        fetch(`https://nr-ai-form-test-api-fd-beb0ajayctfxd9dv.a02.azurefd.net/?${params}`, {
            method: 'GET'
        })
        .then(response => response.json())
        .then(result => {
            if (responseMessage) {
                responseMessage.innerText = "Success: " + result.id + " " + result.message;
            }
            console.log("API Response:", result);
        })
        .catch(error => {
            console.error("Error:", error);
            if (responseMessage) {
                responseMessage.innerText = "Error submitting form.";
            }
        });
    }
    
    // Add submit handler for form submissions
    const ajaxForm = document.getElementById("sampleForm");
    if (ajaxForm) {
        ajaxForm.addEventListener("submit", function(event) {
            event.preventDefault(); // Prevent normal form submission
            sendFormDataToApi();
        });
    }
    
    // Set up listeners after form is created
    setupFieldListeners();
});
