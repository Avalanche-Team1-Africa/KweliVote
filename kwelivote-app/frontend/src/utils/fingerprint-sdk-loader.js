/**
 * Utility function to load the WebSDK scripts required for fingerprint reader
 * 
 * This function dynamically loads the required scripts for the fingerprint reader SDK
 * and returns a promise that resolves when all scripts are loaded
 */
export const loadWebSdk = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Fingerprint) {
      console.log('WebSDK already loaded');
      resolve();
      return;
    }

    const scriptUrls = [
      '/scripts/es6-shim.js',
      '/scripts/websdk.client.bundle.min.js',
      '/scripts/fingerprint.sdk.min.js'
    ];
    
    let loadedCount = 0;
    
    scriptUrls.forEach(url => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      script.onload = () => {
        loadedCount++;
        if (loadedCount === scriptUrls.length) {
          console.log('WebSDK scripts loaded successfully');
          resolve();
        }
      };
      
      script.onerror = (error) => {
        console.error(`Failed to load script: ${url}`, error);
        reject(new Error(`Failed to load WebSDK script: ${url}`));
      };
      
      document.head.appendChild(script);
    });
  });
};

export default {
  loadWebSdk
};
