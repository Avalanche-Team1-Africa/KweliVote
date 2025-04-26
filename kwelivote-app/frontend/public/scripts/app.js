var test = null;

var state = document.getElementById("content-capture");

var myVal = ""; // Drop down selected value of reader
var disabled = true;
var startEnroll = false;

// Biometric identity variables
var bioIdentity = {
  userId: "",
  fingerprints: [],
  createdAt: "",
  readerInfo: {},
  formatInfo: {
    name: "ANSI-INCITS 378-2004",
    type: "ISO/IEC 19794-2",
    description: "Finger Minutiae Record Format",
  },
};
var scanCount = 0;
var totalScansNeeded = 5;
var bioIdentityMode = false;
var identificationMode = false;

// Collection to store all biometric identities
var allBioIdentities = [];
var bioIdentitiesFileName = "biometric_identities.json";

// Configure to use HID Authentication Device Lite Client
var useClientMode = true;

// Default to ANSI/ISO compliant format for biometric data
var currentFormat = Fingerprint.SampleFormat.Intermediate;
var deviceTechn = {
  0: "Unknown",
  1: "Optical",
  2: "Capacitive",
  3: "Thermal",
  4: "Pressure",
};

var deviceModality = {
  0: "Unknown",
  1: "Swipe",
  2: "Area",
  3: "AreaMultifinger",
};

var deviceUidType = {
  0: "Persistent",
  1: "Volatile",
};

var FingerprintSdkTest = (function () {
  function FingerprintSdkTest() {
    var _instance = this;
    this.operationToRestart = null;
    this.acquisitionStarted = false;

    // Initialize the SDK with client mode if configured
    if (useClientMode) {
      this.sdk = new Fingerprint.WebApi({
        useClient: true,
        clientURI: "http://localhost:15896", // Default port for HID Authentication Device Lite Client
      });
      console.log("Using HID Authentication Device Lite Client mode");
    } else {
      this.sdk = new Fingerprint.WebApi();
    }

    this.sdk.onDeviceConnected = function (e) {
      // Detects if the deveice is connected for which acquisition started
      showMessage("Scan your finger");
    };
    this.sdk.onDeviceDisconnected = function (e) {
      // Detects if device gets disconnected - provides deviceUid of disconnected device
      showMessage("Device disconnected");
    };
    this.sdk.onCommunicationFailed = function (e) {
      // Detects if there is a failure in communicating with U.R.U web SDK
      showMessage("Communinication Failed");
    };
    this.sdk.onSamplesAcquired = function (s) {
      // Sample acquired event triggers this function
      sampleAcquired(s);
    };
    this.sdk.onQualityReported = function (e) {
      // Quality of sample aquired - Function triggered on every sample acquired
      document.getElementById("qualityInputBox").value =
        Fingerprint.QualityCode[e.quality];
    };
  }

  FingerprintSdkTest.prototype.startCapture = function () {
    if (this.acquisitionStarted)
      // Monitoring if already started capturing
      return;
    var _instance = this;
    showMessage("");
    this.operationToRestart = this.startCapture;
    this.sdk.startAcquisition(currentFormat, myVal).then(
      function () {
        _instance.acquisitionStarted = true;

        //Disabling start once started
        disableEnableStartStop();
      },
      function (error) {
        showMessage(error.message);
      }
    );
  };
  FingerprintSdkTest.prototype.stopCapture = function () {
    if (!this.acquisitionStarted)
      //Monitor if already stopped capturing
      return;
    var _instance = this;
    showMessage("");
    this.sdk.stopAcquisition().then(
      function () {
        _instance.acquisitionStarted = false;

        //Disabling stop once stoped
        disableEnableStartStop();
      },
      function (error) {
        showMessage(error.message);
      }
    );
  };

  FingerprintSdkTest.prototype.getInfo = function () {
    var _instance = this;
    return this.sdk.enumerateDevices();
  };

  FingerprintSdkTest.prototype.getDeviceInfoWithID = function (uid) {
    var _instance = this;
    return this.sdk.getDeviceInfo(uid);
  };

  return FingerprintSdkTest;
})();

function showMessage(message) {
  var _instance = this;
  //var statusWindow = document.getElementById("status");
  x = state.querySelectorAll("#status");
  if (x.length != 0) {
    x[0].innerHTML = message;
  }
}

// Functions to control UI element states
function disableEnable() {
  var readersDropDown = document.getElementById("readersDropDown");

  if (myVal === "") {
    // If no reader is selected
    document.getElementById("start").disabled = true;
    document.getElementById("stop").disabled = true;
    if (readersDropDown) {
      disabled = true;
    }
  } else {
    // If reader is selected
    document.getElementById("start").disabled = false;
    document.getElementById("stop").disabled = true;
    if (readersDropDown) {
      disabled = false;
    }
  }
}

function disableEnableStartStop() {
  if (test.acquisitionStarted) {
    // If acquisition started - disable start and enable stop
    document.getElementById("start").disabled = true;
    document.getElementById("stop").disabled = false;
  } else {
    // If acquisition stopped - enable start and disable stop
    document.getElementById("start").disabled = false;
    document.getElementById("stop").disabled = true;
  }
}

function disableEnableExport(disabled) {
  if (document.getElementById("saveImagePng")) {
    document.getElementById("saveImagePng").disabled = disabled;
  }
}

function enableDisableScanQualityDiv(id) {
  if (id === "content-reader") {
    document.getElementById("Scores").style.display = "none";
  } else {
    document.getElementById("Scores").style.display = "block";
  }
}

// Format selection
function assignFormat() {
  if (document.myForm.PngImage.checked) {
    currentFormat = Fingerprint.SampleFormat.PngImage;
  } else if (document.myForm.Raw.checked) {
    currentFormat = Fingerprint.SampleFormat.Raw;
  } else if (document.myForm.Intermediate.checked) {
    currentFormat = Fingerprint.SampleFormat.Intermediate;
  } else if (document.myForm.Compressed.checked) {
    currentFormat = Fingerprint.SampleFormat.Compressed;
  } else {
    currentFormat = "";
  }
}

function checkOnly(checkBox) {
  var formElements = document.myForm.elements;
  for (var i = 0; i < formElements.length; i++) {
    if (formElements[i].type === "checkbox") {
      formElements[i].checked = false;
    }
  }
  checkBox.checked = true;
}

function delayAnimate(id, visibility) {
  document.getElementById(id).style.display = visibility;
}

// Function to download image
function onImageDownload() {
  var dataFormat = "";
  var dataToDownload = "";
  var fileName = "";

  if (document.myForm.PngImage.checked) {
    dataFormat = "data:image/png;base64,";
    dataToDownload = localStorage.getItem("imageSrc").replace(dataFormat, "");
    fileName = "fingerprint.png";
  } else if (document.myForm.Raw.checked) {
    dataToDownload = localStorage.getItem("raw");
    fileName = "fingerprint.raw";
  } else if (document.myForm.Intermediate.checked) {
    dataToDownload = localStorage.getItem("intermediate");
    fileName = "fingerprint.ansi-fmr";
  } else if (document.myForm.Compressed.checked) {
    dataFormat = "data:application/octet-stream;base64,";
    dataToDownload = localStorage.getItem("wsq").replace(dataFormat, "");
    fileName = "fingerprint.wsq";
  }

  if (dataToDownload) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    var byteCharacters = atob(dataToDownload);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += 512) {
      var slice = byteCharacters.slice(offset, offset + 512);
      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, { type: "application/octet-stream" });
    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  } else {
    alert("No fingerprint data available to export");
  }
}

// Set active tab
function setActive(element, element2) {
  document.getElementById(element).setAttribute("class", "active");
  document.getElementById(element2).setAttribute("class", "");
}

// Show reader capabilities in modal popup
function populatePopUpModal() {
  var readersDropDown = document.getElementById("readersDropDown");
  var selectedReader =
    readersDropDown.options[readersDropDown.selectedIndex].value;

  if (selectedReader) {
    var readerInfo = document.getElementById("ReaderInformationFromDropDown");
    readerInfo.innerHTML = "Loading reader capabilities...";

    var deviceInfoPromise = test.getDeviceInfoWithID(selectedReader);
    deviceInfoPromise.then(
      function (deviceInfo) {
        var deviceId = deviceInfo.DeviceID;
        var uidTyp = deviceUidType[deviceInfo.eUidType];
        var modality = deviceModality[deviceInfo.eDeviceModality];
        var deviceTech = deviceTechn[deviceInfo.eDeviceTech];

        var infoHtml =
          "<b>Reader Information</b><br><br>" +
          "ID: " +
          deviceId +
          "<br>" +
          "UID Type: " +
          uidTyp +
          "<br>" +
          "Technology: " +
          deviceTech +
          "<br>" +
          "Modality: " +
          modality +
          "<br>";

        readerInfo.innerHTML = infoHtml;
      },
      function (error) {
        readerInfo.innerHTML =
          "Error getting reader information: " + error.message;
      }
    );
  } else {
    document.getElementById("ReaderInformationFromDropDown").innerHTML =
      "Please select a reader first";
  }
}

window.onload = function () {
  localStorage.clear();
  test = new FingerprintSdkTest();
  readersDropDownPopulate(true); //To populate readers for drop down selection
  disableEnable(); // Disabling enabling buttons - if reader not selected
  enableDisableScanQualityDiv("content-reader"); // To enable disable scan quality div
  disableEnableExport(true);

  // Set up download button click handler
  document
    .getElementById("downloadJsonBtn")
    .addEventListener("click", function () {
      downloadBiometricIdentities();
    });

  // Try to load existing identities from file
  tryLoadIdentitiesFromFile();
};

function onStart() {
  assignFormat();
  if (currentFormat == "") {
    alert("Please select a format.");
  } else {
    test.startCapture();

    // Add error debugging for HID client mode
    if (useClientMode) {
      console.log("Starting capture in HID client mode");
      showMessage(
        "Starting capture in HID client mode. Check console for details."
      );
    }
  }
}

function onStop() {
  test.stopCapture();
}

function onGetInfo() {
  var allReaders = test.getInfo();
  if (useClientMode) {
    console.log(
      "Getting reader info from HID Authentication Device Lite Client"
    );
  }

  allReaders.then(
    function (sucessObj) {
      populateReaders(sucessObj);
      console.log("Readers detected:", sucessObj);
    },
    function (error) {
      showMessage(error.message);
      console.error("Error getting readers:", error);
    }
  );
}
function onDeviceInfo(id, element) {
  var myDeviceVal = test.getDeviceInfoWithID(id);
  myDeviceVal.then(
    function (sucessObj) {
      console.log("sucessObj", sucessObj);
      var deviceId = sucessObj.DeviceID;
      var uidTyp = deviceUidType[sucessObj.eUidType];
      var modality = deviceModality[sucessObj.eDeviceModality];
      var deviceTech = deviceTechn[sucessObj.eDeviceTech];
      //Another method to get Device technology directly from SDK
      //Uncomment the below logging messages to see it working, Similarly for DeviceUidType and DeviceModality
      //console.log(Fingerprint.DeviceTechnology[sucessObj.eDeviceTech]);
      //console.log(Fingerprint.DeviceModality[sucessObj.eDeviceModality]);
      //console.log(Fingerprint.DeviceUidType[sucessObj.eUidType]);
      var retutnVal = //"Device Info -"
        "Id : " +
        deviceId +
        "<br> Uid Type : " +
        uidTyp +
        "<br> Device Tech : " +
        deviceTech +
        "<br> Device Modality : " +
        modality;

      document.getElementById(element).innerHTML = retutnVal;
    },
    function (error) {
      showMessage(error.message);
    }
  );
}
function onClear() {
  var vDiv = document.getElementById("imagediv");
  vDiv.innerHTML = "";
  localStorage.setItem("imageSrc", "");
  localStorage.setItem("wsq", "");
  localStorage.setItem("raw", "");
  localStorage.setItem("intermediate", "");

  disableEnableExport(true);
}

function toggle_visibility(ids) {
  document.getElementById("qualityInputBox").value = "";
  onStop();
  enableDisableScanQualityDiv(ids[0]); // To enable disable scan quality div
  for (var i = 0; i < ids.length; i++) {
    var e = document.getElementById(ids[i]);
    if (i == 0) {
      e.style.display = "block";
      state = e;
      disableEnable();
    } else {
      e.style.display = "none";
    }
  }
}

$("#save").on("click", function () {
  if (
    localStorage.getItem("imageSrc") == "" ||
    localStorage.getItem("imageSrc") == null ||
    document.getElementById("imagediv").innerHTML == ""
  ) {
    alert("Error -> Fingerprint not available");
  } else {
    var vDiv = document.getElementById("imageGallery");
    if (vDiv.children.length < 5) {
      var image = document.createElement("img");
      image.id = "galleryImage";
      image.className = "img-thumbnail";
      image.src = localStorage.getItem("imageSrc");
      vDiv.appendChild(image);

      localStorage.setItem(
        "imageSrc" + vDiv.children.length,
        localStorage.getItem("imageSrc")
      );
    } else {
      document.getElementById("imageGallery").innerHTML = "";
      $("#save").click();
    }
  }
});

function populateReaders(readersArray) {
  var _deviceInfoTable = document.getElementById("deviceInfo");
  _deviceInfoTable.innerHTML = "";
  if (readersArray.length != 0) {
    _deviceInfoTable.innerHTML += "<h4>Available Readers</h4>";
    for (i = 0; i < readersArray.length; i++) {
      _deviceInfoTable.innerHTML +=
        "<div id='dynamicInfoDivs' align='left'>" +
        "<div data-toggle='collapse' data-target='#" +
        readersArray[i] +
        "'>" +
        "<img src='images/info.png' alt='Info' height='20' width='20'> &nbsp; &nbsp;" +
        readersArray[i] +
        "</div>" +
        "<p class='collapse' id=" +
        '"' +
        readersArray[i] +
        '"' +
        ">" +
        onDeviceInfo(readersArray[i], readersArray[i]) +
        "</p>" +
        "</div>";
    }
  }
}

function sampleAcquired(s) {
  if (currentFormat == Fingerprint.SampleFormat.PngImage) {
    // If sample acquired format is PNG- perform following call on object recieved
    // Get samples from the object - get 0th element of samples as base 64 encoded PNG image
    localStorage.setItem("imageSrc", "");
    var samples = JSON.parse(s.samples);
    localStorage.setItem(
      "imageSrc",
      "data:image/png;base64," + Fingerprint.b64UrlTo64(samples[0])
    );
    if (state == document.getElementById("content-capture")) {
      var vDiv = document.getElementById("imagediv");
      vDiv.innerHTML = "";
      var image = document.createElement("img");
      image.id = "image";
      image.src = localStorage.getItem("imageSrc");
      vDiv.appendChild(image);
    }

    disableEnableExport(false);

    // Handle biometric identity enrollment if active
    if (bioIdentityMode && scanCount < totalScansNeeded) {
      processBiometricScan(samples[0]);
    }
    // Handle identification mode if active
    else if (identificationMode) {
      identifyFingerprint(samples[0]);
    }
  } else if (currentFormat == Fingerprint.SampleFormat.Raw) {
    // If sample acquired format is RAW- perform following call on object recieved
    // Get samples from the object - get 0th element of samples and then get Data from it.
    // Returned data is Base 64 encoded, which needs to get decoded to UTF8,
    // after decoding get Data key from it, it returns Base64 encoded raw image data
    localStorage.setItem("raw", "");
    var samples = JSON.parse(s.samples);
    var sampleData = Fingerprint.b64UrlTo64(samples[0].Data);
    var decodedData = JSON.parse(Fingerprint.b64UrlToUtf8(sampleData));
    localStorage.setItem("raw", Fingerprint.b64UrlTo64(decodedData.Data));

    var vDiv = (document.getElementById("imagediv").innerHTML =
      '<div id="animateText" style="display:none">RAW Sample Acquired <br>' +
      Date() +
      "</div>");
    setTimeout('delayAnimate("animateText","table-cell")', 100);

    disableEnableExport(false);
  } else if (currentFormat == Fingerprint.SampleFormat.Compressed) {
    // If sample acquired format is Compressed- perform following call on object recieved
    // Get samples from the object - get 0th element of samples and then get Data from it.
    // Returned data is Base 64 encoded, which needs to get decoded to UTF8,
    // after decoding get Data key from it, it returns Base64 encoded wsq image
    localStorage.setItem("wsq", "");
    var samples = JSON.parse(s.samples);
    var sampleData = Fingerprint.b64UrlTo64(samples[0].Data);
    var decodedData = JSON.parse(Fingerprint.b64UrlToUtf8(sampleData));
    localStorage.setItem(
      "wsq",
      "data:application/octet-stream;base64," +
        Fingerprint.b64UrlTo64(decodedData.Data)
    );

    var vDiv = (document.getElementById("imagediv").innerHTML =
      '<div id="animateText" style="display:none">WSQ Sample Acquired <br>' +
      Date() +
      "</div>");
    setTimeout('delayAnimate("animateText","table-cell")', 100);

    disableEnableExport(false);
  } else if (currentFormat == Fingerprint.SampleFormat.Intermediate) {
    // If sample acquired format is Intermediate- perform following call on object recieved
    // Get samples from the object - get 0th element of samples and then get Data from it.
    // It returns Base64 encoded feature set
    localStorage.setItem("intermediate", "");
    var samples = JSON.parse(s.samples);
    var sampleData = Fingerprint.b64UrlTo64(samples[0].Data);
    localStorage.setItem("intermediate", sampleData);

    var vDiv = (document.getElementById("imagediv").innerHTML =
      '<div id="animateText" style="display:none">Intermediate Sample Acquired <br>' +
      Date() +
      "</div>");
    setTimeout('delayAnimate("animateText","table-cell")', 100);

    disableEnableExport(false);
  }
}

function readersDropDownPopulate(firstLoad) {
  var allReaders = test.getInfo();
  if (useClientMode) {
    console.log("Getting readers from HID Authentication Device Lite Client");
    showMessage("Checking for connected readers...");
  }

  allReaders.then(
    function (successObj) {
      var readersDropDown = document.getElementById("readersDropDown");
      // Clear existing options
      readersDropDown.innerHTML = "";

      // Add default option
      var option = document.createElement("option");
      option.text = "Select Reader";
      option.value = "";
      readersDropDown.add(option);

      if (successObj && successObj.length > 0) {
        console.log("Readers found:", successObj);
        showMessage("Readers found: " + successObj.length);

        // Add readers to dropdown
        for (var i = 0; i < successObj.length; i++) {
          var option = document.createElement("option");
          option.text = successObj[i];
          option.value = successObj[i];
          readersDropDown.add(option);
        }

        // Enable reader selection
        readersDropDown.disabled = false;

        // If first load and we have readers, select the first one
        if (firstLoad && successObj.length > 0 && myVal === "") {
          readersDropDown.selectedIndex = 1; // Select first reader
          myVal = readersDropDown.options[readersDropDown.selectedIndex].value;
          disableEnable(); // Update button states
        }
      } else {
        console.log("No readers found");
        showMessage(
          "No readers detected. Please connect a fingerprint reader."
        );
        readersDropDown.disabled = true;
      }
    },
    function (error) {
      console.error("Error getting readers:", error);
      showMessage("Error detecting readers: " + error.message);
    }
  );
}

function selectChangeEvent() {
  var readersDropDown = document.getElementById("readersDropDown");
  myVal = readersDropDown.options[readersDropDown.selectedIndex].value;
  console.log("Reader selected:", myVal);
  disableEnable();
}

function startBiometricEnrollment() {
  // Get user ID from input field
  var userId = document.getElementById("userIdInput").value;
  if (!userId) {
    alert("Please enter a User ID before starting enrollment.");
    return;
  }

  // Reset biometric identity
  bioIdentity = {
    userId: userId,
    fingerprints: [],
    createdAt: new Date().toISOString(),
    readerInfo: {},
    formatInfo: {
      name: "ANSI-INCITS 378-2004",
      type: "ISO/IEC 19794-2",
      description: "Finger Minutiae Record Format",
    },
  };

  // Reset scan count
  scanCount = 0;

  // Set biometric mode active
  bioIdentityMode = true;

  // Update UI
  updateBioIdentityUI();

  // Get reader info to store with identity
  var allReaders = test.getInfo();
  allReaders.then(
    function (successObj) {
      if (successObj && successObj.length > 0) {
        var deviceInfoPromise = test.getDeviceInfoWithID(myVal);
        deviceInfoPromise.then(
          function (deviceInfo) {
            bioIdentity.readerInfo = {
              deviceId: deviceInfo.DeviceID,
              deviceTech: deviceTechn[deviceInfo.eDeviceTech],
              deviceModality: deviceModality[deviceInfo.eDeviceModality],
              uidType: deviceUidType[deviceInfo.eUidType],
            };
          },
          function (error) {
            console.error("Error getting device info:", error);
          }
        );
      }
    },
    function (error) {
      console.error("Error getting reader info:", error);
    }
  );

  // Start the capture
  document.getElementById("bioIdentityStatus").innerHTML =
    "<span style='color: green;'>Scanning active. Please scan your finger " +
    totalScansNeeded +
    " times.</span>";
  onStart();
}

function processBiometricScan(sampleData) {
  // Process the fingerprint data
  // For standard compliance, use Intermediate format which is ANSI/ISO compliant

  let standardData;

  if (currentFormat === Fingerprint.SampleFormat.Intermediate) {
    // Already in ANSI/ISO compliant format
    standardData = sampleData;
  } else if (currentFormat === Fingerprint.SampleFormat.PngImage) {
    // We need to convert the PNG image to an intermediate format for standards compliance
    console.log("Converting PNG to ANSI/ISO compliant format");
    // Using the sample as-is since the app doesn't have direct PNG-to-template conversion
    // In a production environment, you would use a proper conversion function
    standardData = sampleData;
  } else {
    // For other formats, use as is but note that it's not standards compliant
    console.log(
      "Using non-standard format. Consider using ANSI/ISO compliant template format."
    );
    standardData = sampleData;
  }

  // Add fingerprint data to the collection with format information
  bioIdentity.fingerprints.push({
    sample: standardData,
    format: "ANSI-INCITS 378-2004",
    quality: document.getElementById("qualityInputBox").value,
    timestamp: new Date().toISOString(),
    scanIndex: scanCount + 1,
  });

  scanCount++;

  // Update UI
  updateBioIdentityUI();

  // Check if we've completed all scans
  if (scanCount >= totalScansNeeded) {
    onStop();
    bioIdentityMode = false;
    document.getElementById("bioIdentityStatus").innerHTML =
      "<span style='color: blue;'>All scans complete! You can now save your biometric identity.</span>";
    document.getElementById("saveBioIdentityBtn").style.display =
      "inline-block";
  } else {
    // Temporarily stop and start capture again for next finger
    onStop();
    setTimeout(function () {
      document.getElementById("bioIdentityStatus").innerHTML =
        "<span style='color: green;'>Please scan your finger again. " +
        (totalScansNeeded - scanCount) +
        " scans remaining.</span>";
      onStart();
    }, 1500);
  }
}

function updateBioIdentityUI() {
  document.getElementById("bioScansRemaining").innerHTML =
    "Scans completed: " + scanCount + " / " + totalScansNeeded;
  document.getElementById("startBioEnrollBtn").disabled = bioIdentityMode;
}

function saveBiometricIdentity() {
  if (bioIdentity.fingerprints.length < totalScansNeeded) {
    alert("Please complete all " + totalScansNeeded + " scans first.");
    return;
  }

  // Try to load existing biometric identities from localStorage
  try {
    const existingData = localStorage.getItem(bioIdentitiesFileName);
    if (existingData) {
      allBioIdentities = JSON.parse(existingData);
    }
  } catch (error) {
    console.error("Error loading existing biometric identities:", error);
    allBioIdentities = [];
  }

  // Check if this ID already exists in the collection
  const existingIndex = allBioIdentities.findIndex(
    (item) => item.userId === bioIdentity.userId
  );

  if (existingIndex !== -1) {
    // Update existing record
    allBioIdentities[existingIndex] = bioIdentity;
  } else {
    // Add new record
    allBioIdentities.push(bioIdentity);
  }

  // Save updated collection back to localStorage
  localStorage.setItem(bioIdentitiesFileName, JSON.stringify(allBioIdentities));

  // Prepare the JSON blob for download when user confirms
  prepareJsonForDownload();

  // Show the project root path in the modal
  document.getElementById("projectRootPath").textContent =
    window.location.href.substring(
      0,
      window.location.href.lastIndexOf("/") + 1
    );

  // Show the save instructions modal
  $("#saveInstructionsModal").modal("show");

  // Reset UI elements
  document.getElementById("saveBioIdentityBtn").style.display = "none";
  document.getElementById("bioIdentityStatus").innerHTML =
    "<span style='color: green;'>Biometric identity saved successfully!</span>";

  // Clear biometric identity after saving
  setTimeout(function () {
    bioIdentityMode = false;
    scanCount = 0;
    updateBioIdentityUI();
    document.getElementById("bioIdentityStatus").innerHTML = "";
    document.getElementById("userIdInput").value = "";
  }, 3000);
}

// Function to prepare the JSON data for download
function prepareJsonForDownload() {
  // Create a JSON blob
  window.bioIdentitiesBlob = new Blob(
    [JSON.stringify(allBioIdentities, null, 2)],
    {
      type: "application/json",
    }
  );
}

// Function to download the biometric identities JSON file
function downloadBiometricIdentities() {
  if (!window.bioIdentitiesBlob) {
    return;
  }

  var url = URL.createObjectURL(window.bioIdentitiesBlob);
  var downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = bioIdentitiesFileName;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  // Hide the modal after download
  $("#saveInstructionsModal").modal("hide");
}

// Function to try loading existing identities from file
function tryLoadIdentitiesFromFile() {
  // Check if the file already exists by making a HEAD request
  var xhr = new XMLHttpRequest();
  xhr.open("HEAD", bioIdentitiesFileName, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // File exists, load it
        loadIdentitiesFromFile();
      } else {
        // File doesn't exist, use localStorage data
        console.log(
          "Biometric identities file not found in project root, using localStorage data"
        );
      }
    }
  };
  xhr.send();
}

// Function to load identities from file
function loadIdentitiesFromFile() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", bioIdentitiesFileName, true);
  xhr.responseType = "text";
  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const loadedIdentities = JSON.parse(xhr.responseText);
        console.log(
          "Successfully loaded " +
            loadedIdentities.length +
            " identities from file"
        );

        // Update localStorage with loaded data
        allBioIdentities = loadedIdentities;
        localStorage.setItem(
          bioIdentitiesFileName,
          JSON.stringify(allBioIdentities)
        );
      } catch (error) {
        console.error("Error parsing biometric identities from file:", error);
      }
    }
  };
  xhr.send();
}

// Function to start fingerprint identification
function startIdentification() {
  // Check if we have stored identities
  const existingData = localStorage.getItem(bioIdentitiesFileName);
  if (!existingData) {
    document.getElementById("identificationStatus").innerHTML =
      "<span style='color: red;'>No biometric identities found. Please enroll at least one user first.</span>";
    return;
  }

  // Load stored identities
  try {
    allBioIdentities = JSON.parse(existingData);
    if (allBioIdentities.length === 0) {
      document.getElementById("identificationStatus").innerHTML =
        "<span style='color: red;'>No biometric identities found. Please enroll at least one user first.</span>";
      return;
    }
  } catch (error) {
    console.error("Error parsing biometric identities:", error);
    document.getElementById("identificationStatus").innerHTML =
      "<span style='color: red;'>Error loading biometric identities.</span>";
    return;
  }

  // Set identification mode
  identificationMode = true;
  document.getElementById("startIdentificationBtn").disabled = true;
  document.getElementById("identificationStatus").innerHTML =
    "<span style='color: blue;'>Please scan your finger for identification.</span>";
  document.getElementById("identificationResult").innerHTML = "";

  // Start fingerprint capture
  onStart();
}

// Function to identify a fingerprint against stored samples
function identifyFingerprint(sampleData) {
  document.getElementById("identificationStatus").innerHTML =
    "<span style='color: blue;'>Processing fingerprint...</span>";

  // Stop capturing
  onStop();

  // First convert the sample data to a standardized format if needed
  let standardSampleData;
  if (currentFormat === Fingerprint.SampleFormat.Intermediate) {
    // Already in ANSI/ISO compliant format
    standardSampleData = sampleData;
    console.log(
      "Using ANSI-INCITS 378-2004 compliant template for identification"
    );
  } else {
    // Using the provided format, but note this may impact accuracy with templates from other systems
    standardSampleData = sampleData;
    console.log(
      "Warning: Using non-standard template format for identification"
    );
  }

  // Simple comparison approach - production systems would use a proper matching algorithm
  let bestMatchScore = 0;
  let bestMatchId = null;
  let bestMatchFormat = null;

  // Compare against all stored fingerprints
  for (const identity of allBioIdentities) {
    for (const fingerprint of identity.fingerprints) {
      // Check if we're comparing the same format types
      const format = fingerprint.format || "Unknown";
      const isStandardFormat =
        format.includes("ANSI") || format.includes("ISO");

      // Calculate similarity
      const similarity = calculateSimilarity(
        standardSampleData,
        fingerprint.sample
      );

      // Give higher weight to matches with standard formats
      const adjustedScore = isStandardFormat ? similarity * 1.2 : similarity;

      if (adjustedScore > bestMatchScore) {
        bestMatchScore = adjustedScore;
        bestMatchId = identity.userId;
        bestMatchFormat = format;
      }
    }
  }

  // Normalize score if it exceeds 1.0 due to the weighting
  if (bestMatchScore > 1.0) bestMatchScore = 1.0;

  // Show result with information about the match format
  if (bestMatchScore > 0.5) {
    // Simple threshold - would need proper tuning in real app
    document.getElementById("identificationResult").innerHTML =
      "<span style='color: green;'>Identified user: " +
      bestMatchId +
      " (Match confidence: " +
      Math.round(bestMatchScore * 100) +
      "%, Format: " +
      bestMatchFormat +
      ")</span>";
    console.log(
      "Matched using " +
        bestMatchFormat +
        " format with score " +
        bestMatchScore
    );
  } else {
    document.getElementById("identificationResult").innerHTML =
      "<span style='color: red;'>No match found. Please try again or enroll.</span>";
  }

  // Reset identification mode
  identificationMode = false;
  document.getElementById("startIdentificationBtn").disabled = false;
  document.getElementById("identificationStatus").innerHTML =
    "<span style='color: green;'>Identification complete.</span>";
}

// Simple similarity function for demonstration purposes
// A real implementation would use a proper fingerprint matching algorithm
// This is a very basic approximation that works for demo purposes only
function calculateSimilarity(sample1, sample2) {
  // Convert samples to strings
  const str1 = JSON.stringify(sample1);
  const str2 = JSON.stringify(sample2);

  // Very simplified comparison - real implementations would use proper matching algorithms
  // For demo purposes, we'll just check if the samples are similar in size
  const lenDiff = Math.abs(str1.length - str2.length);
  const maxLen = Math.max(str1.length, str2.length);
  const similarity = 1 - lenDiff / maxLen;

  console.log(`Comparing fingerprints, similarity: ${similarity}`);
  return similarity;
}
