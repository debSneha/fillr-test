'use strict'

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

    if (isTopFrame()) {
      
      // scrape fields for parent frame 
      let fields = extractFormFields()
      allFields.push(...fields)

      window.addEventListener('message', (event) => {
        // - Merge fields from frames.
        // - Process Fields and send event once all fields are collected.
        if(event.data && event.data.type === 'fields'){
          ++frameCount
          allFields.push(...event.data.fields)
        }
        
        // dispatch frames:loaded event only after data from all child frames have been collected
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
      
      // scrape form fields for child frames
      let fields = extractFormFields()
      // Child frames sends Fields up to Top Frame.
      // send postMessage after extracting data
      topFrame.postMessage({type:'fields', fields}, 'http://localhost:9999/');

    }
	} catch (e) {
		console.error(e)
	}
}

// Utility functions to check and get the top frame
// as Karma test framework changes top & context frames.
// Use this instead of "window.top".
function getTopFrame() {
  return window.top.frames[0];
}

function isTopFrame() {
  return window.location.pathname == '/context.html';
}

execute();
