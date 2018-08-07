let currentscript = document.createElement('script');
currentscript.setAttribute('action','/forecast');
currentscript.setAttribute('maps_api_key', 'mapsKey');
currentscript.setAttribute('timezome_api_key','timezoneKey');
Object.defineProperty(document, 'currentScript', {
    value: currentscript,
});
