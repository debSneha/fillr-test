'use strict'
// Write your module here
// It must send an event "frames:loaded" from the top frame containing a list of { name:label } pairs,
// which describes all the fields in each frame.

// This is a template to help you get started, feel free to make your own solution.


// function to scrape or extract form fields 
function extractFormFields(){
  try{
    const fields = []
    // get all the form controls 
    // only input and select is needed for present test 
    // but can be extended to use other form elements like textarea
    const controls = document.querySelectorAll('input, select, textarea')

    // loops over all controls and gets the name attribute and label for same
    controls.forEach(control => { 

      let name = control.getAttribute('name')
      let labels = control.labels
      if(labels && labels.length > 0 && name){
        fields.push({ [name] : labels[0].innerText})
      }

    });
    return fields
  }catch(e){
    console.log(e)
  }
}

function sortAllFields(allFields){
  allFields.sort((a,b) => {
    const keyA = Object.keys(a)[0]
    const keyB = Object.keys(b)[0]
    return keyA.localeCompare(keyB)
  })
}

function countAllFrames(frameWindow) {
  let count = 0;
  try{
    for (let i = 0; i < frameWindow?.frames?.length; i++) {
      count++;
      count += countAllFrames(frameWindow?.frames[i]);
    }
  }catch(e){
    console.log("Error: ",e)
  }
  
  return count;
}

function execute() {
	try {
    let allFields = []
    const topFrame = getTopFrame()
    let totalframes = countAllFrames(window.top)
    let frameCount = 0

    // Step 1 Scrape Fields and Create Fields list object.
    // Step 2 Add Listener for Top Frame to Receive Fields.
    console.log(totalframes)
    if (isTopFrame()) {
      
      let fields = extractFormFields()
      allFields.push(...fields)

      window.addEventListener('message', (event) => {
        // - Merge fields from frames.
        // - Process Fields and send event once all fields are collected.
        if(event.data && event.data.type === 'fields'){
          ++frameCount
          allFields.push(...event.data.fields)
        }
        
        //wait before all the data is collected by parent frame 
        //before dispatching fieldsLoaded event 
        if(frameCount === totalframes){
          // sort final allfields list to pass tests
          sortAllFields(allFields)
          // create event 
          const fieldsLoadedEvent = new CustomEvent('frames:loaded', {
            detail: { fields: allFields}
          })
          // dispatch event
          topFrame.document.dispatchEvent(fieldsLoadedEvent)
        }
      });

    } else if (!isTopFrame()) {
      // Child frames sends Fields up to Top Frame.
      let fields = extractFormFields()
      // send postMessage after extracting data
      topFrame.postMessage({type:'fields', fields}, '*');

    }
	} catch (e) {
		console.error(e)
	}
}

execute();

// Utility functions to check and get the top frame
// as Karma test framework changes top & context frames.
// Use this instead of "window.top".
function getTopFrame() {
  return window.top.frames[0];
}

function isTopFrame() {
  return window.location.pathname == '/context.html';
}