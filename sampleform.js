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
                
                // Capture simplified data using the new feature
                const simplifiedData = FormCapture.extractSimplifiedFields(formsData);
                
                // Log both full and simplified data to console
                //console.log('📊 Full Form Data Captured:', formData);
                console.log('📋 Simplified Data (data-id fields only):', simplifiedData);
                
                // Display captured data in the output div
                const outputElement = document.getElementById('outputData');
                if (outputElement) {
                    outputElement.textContent = JSON.stringify({
                        fullData: formData,
                        simplifiedData: simplifiedData
                    }, null, 2);
                }
                
                // Display simplified data separately if element exists
                const simplifiedOutputElement = document.getElementById('simplifiedOutputData');
                if (simplifiedOutputElement) {
                    simplifiedOutputElement.textContent = JSON.stringify(simplifiedData, null, 2);
                }
            }
        });
        
        // Log the initial simplified data on load
        setTimeout(() => {
            const initialSimplifiedData = captureSimplifiedData();
            //console.log('🚀 Initial Simplified Data on Load:', initialSimplifiedData);
        }, 500);
    }
    
    // Add event listeners to form fields
    function setupFieldListeners() {
        const formFields = document.querySelectorAll('input, select, textarea');
        formFields.forEach(field => {
            // Log when typing finishes (field loses focus) and send data to API
            field.addEventListener('blur', function() {
                //console.log(` User finished typing in field: ${field.name || field.id}`);
                
                // Capture and log simplified data on blur event
                if (typeof captureSimplifiedData !== 'undefined') {
                    const simplifiedData = captureSimplifiedData();
                    //console.log('📝 Simplified Data on Blur:', simplifiedData);
                }
                
                // Get all form data and send to API when any field loses focus
                sendFormDataToApi();
            });
            
            // Also add input event listener for real-time logging
            field.addEventListener('input', function() {
                //console.log(`⌨️  User typing in field: ${field.name || field.id}, value: ${field.value}`);
                
                // Log simplified data on input (with throttling to avoid spam)
                if (typeof captureSimplifiedData !== 'undefined') {
                    clearTimeout(field.inputTimeout);
                    field.inputTimeout = setTimeout(() => {
                        const simplifiedData = captureSimplifiedData();
                        //console.log('🔄 Real-time Simplified Data:', simplifiedData);
                    }, 500); // Throttle to 500ms
                }
            });
            
            // Add change event listener for select elements and checkboxes/radios
            field.addEventListener('change', function() {
                //console.log(`🔄 Field changed: ${field.name || field.id}, new value: ${field.value}`);
                
                // Capture and log simplified data on change
                if (typeof captureSimplifiedData !== 'undefined') {
                    const simplifiedData = captureSimplifiedData();
                    //console.log('📊 Simplified Data on Change:', simplifiedData);
                }
            });
        });
    }
    const aiAgentSendButton = document.getElementById('ai-agent-send');

// Add event listener for AI Agent send button
    if (aiAgentSendButton) {
        aiAgentSendButton.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('AI Assistant send button clicked');
        });

    }    
    // Function to collect form data and send to API
    function sendFormDataToApi() {
        const form = document.getElementById("sampleForm") || document.querySelector('form');
        if (!form) return;
        
        // Collect both regular form data and simplified data
        const formData = new FormData(form);
        const regularData = Object.fromEntries(formData.entries());
        
        // Get simplified data using the new FormCapture feature
        let simplifiedData = [];
        if (typeof captureSimplifiedData !== 'undefined') {
            simplifiedData = captureSimplifiedData();
            console.log('📤 Sending Simplified Data to API:', simplifiedData);
        }
        
        // Update response message element if it exists
        const responseMessage = document.getElementById("responseMessage");
        if (responseMessage) {
            responseMessage.innerText = "Sending data...";
        }
        
        // Create comprehensive payload with both data types
        const payload = {
            regularFormData: regularData,
            simplifiedFormData: simplifiedData,
            timestamp: new Date().toISOString(),
            formId: form.id || 'unknown-form'
        };
        
        //console.log('📦 Complete API Payload:', payload);
        
        // Send request to remote server with simplified data
        const params = new URLSearchParams({
            formData: JSON.stringify(payload)
        }).toString();
        
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
    
    // Add a demo function to show simplified data capture
    function demonstrateSimplifiedCapture() {
        console.log('🎯 === SIMPLIFIED DATA CAPTURE DEMO ===');
        
        if (typeof captureSimplifiedData !== 'undefined') {
            const simplified = captureSimplifiedData();
            //console.log('📋 Current Simplified Data:', simplified);
            
            // Count fields with data-id
            const fieldsWithDataId = simplified.length;
            //console.log(`📊 Found ${fieldsWithDataId} fields with data-id attributes`);
            
            // Show breakdown by field type
            const fieldTypes = {};
            simplified.forEach(field => {
                fieldTypes[field.fieldType] = (fieldTypes[field.fieldType] || 0) + 1;
            });
            //console.log('📈 Field Types Breakdown:', fieldTypes);
            
            // Show fields with values
            const fieldsWithValues = simplified.filter(field => 
                field.fieldValue && field.fieldValue !== '');
            //console.log(`✅ Fields with values: ${fieldsWithValues.length}/${fieldsWithDataId}`);
            
        } else {
            //console.log('❌ captureSimplifiedData function not available');
        }
        
        //console.log('🎯 === END DEMO ===');
    }
    
    // Run demo after a short delay to ensure form is ready
    setTimeout(demonstrateSimplifiedCapture, 1000);
    
    // Make the demo function globally available for manual testing
    window.demonstrateSimplifiedCapture = demonstrateSimplifiedCapture;
});
