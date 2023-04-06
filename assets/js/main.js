  var missedFramesData = {};

  function reloadTableData() {
    $('#sensor-data').DataTable().ajax.reload(null, false);
  }

  $(document).ready(function() {
    console.log('Document ready');
    // Store the API endpoint
    var apiEndpoint = "https://api-ouh.sostark.com/api/anchors";
    // var apiEndpoint = "https://prd.tcs31.sostark.nl/api/anchors";

    // Get the current date and time when the query is initiated
    var dateString = moment().format('YYYY-MM-DD HH:mm:ss'); // Use moment.js to create the date string

    // Add event listener to reset button
    $('#reset-btn').on('click', function() {
      missedFramesData = {}; // Reset missed frames data
      $('#sensor-data').DataTable().ajax.reload(null, false); // Reload table data without resetting searchbuilder filters
      dateString = moment().format('YYYY-MM-DD HH:mm:ss'); // Use moment.js to update the date
      document.querySelector('h2').innerText = 'Anchor information from ' + apiEndpoint + ' - Connected since ' + dateString; // Update the page title with new timestamp for missed frames counter
    });

    function getMapboxUrl(longitude, latitude) {
      var baseUrl = "https://api.mapbox.com/styles/v1/joshpetras/clg2rx9hm009o01nzrjj3iko0/static/";
      var marker = "pin-l+ff2600(" + longitude + "," + latitude + ")";
      // var mapCenter = "/" + longitude + "," + latitude + ",15.99,0";
      var mapCenter = "/10.4259,55.3613,15.26,0"; // Specific to OUH project
      var dimensions = "/640x480";
      var accessToken = "?access_token=pk.eyJ1Ijoiam9zaHBldHJhcyIsImEiOiJjbGcwemQ3Z3YwcmszM3BxMTZubmdoc2FzIn0.XeRFM2zGYI1zMP-ZO9dOFA";

      return baseUrl + marker + mapCenter + dimensions + accessToken;
    }

    // Define table options
    var tableOptions = {
      "ajax": {
        "url": apiEndpoint,
        "dataSrc": "anchors",
        "cache": false,
        "timeout": 10000, // Set timeout to 10 seconds
        "beforeSend": function() {
          // Update the page title before sending the request
          document.querySelector('h2').innerText = 'Anchor information from ' + apiEndpoint + ' - Connected since ' + dateString;
        },
        "error": function(xhr, error, thrown) {
          // Provide a custom error message or behavior
          if (xhr.status === 500) {
            // Show a custom error message for server error
            alert('An error occurred while retrieving the data. The server may be experiencing issues. Please try again later.');
          } else {
            // Show a generic error message for other errors
            alert('An error occurred while retrieving the data. Please check your internet connection and try again.');
          }
          // Clear the loading message from the DataTable
          $('#sensor-data').DataTable().clear().draw();
        }
      },
      "columns": [{
          "data": "tpid",
          "createdCell": function(cell, cellData, rowData) {
            // Check if longitude and latitude values exist
            if (rowData.geoInfo && rowData.geoInfo.longitude && rowData.geoInfo.latitude) {
              var mapboxUrl = getMapboxUrl(rowData.geoInfo.latitude, rowData.geoInfo.longitude); // TM API has these reversed!

              // Add a data attribute to the cell to store the Mapbox URL
              $(cell).attr('data-mapbox-url', mapboxUrl);

              // Initialize Tippy.js tooltip
              tippy(cell, {
                content: '<div style="width: 100%;"><img data-src="' + mapboxUrl + '" alt="Map" style="width: 100%; height: auto;" /></div>',
                maxWidth: '90vw',
                allowHTML: true,
                trigger: 'click',
                placement: 'auto',
                interactive: true,
                arrow: true,
                onShow(instance) {
                  // Set the image src when the tooltip is shown
                  var img = instance.popper.querySelector('img');
                  img.src = img.dataset.src;
                },
                onHidden(instance) {
                  // Clear the image src when the tooltip is hidden
                  var img = instance.popper.querySelector('img');
                  img.src = '';
                }
              });
            }
          }
        },
        {
          "data": "tpid",
          "render": function(data, type, row) {
            // Extract the hexadecimal part of the tpid
            var hex = data.split("-")[1];
            // Convert the hexadecimal to decimal and adjust for TM numbering methodology subtracting d000 or 53248.
            var decimal = parseInt(hex, 16) - 53248;
            return decimal;
          }
        },
        {
          "data": "geoInfo.building",
          "render": function(data, type, row) {
            return (data) ? data : '';
          }
        },
        {
          "data": "geoInfo.floor",
          "render": function(data, type, row) {
            return (data) ? data : '';
          }
        },
        {
          "data": "geoInfo.zone",
          "render": function(data, type, row) {
            return (data) ? data : '';
          }
        },
        {
          "data": null,
          "render": function(data, type, row) {
            // find gateway with highest rssi
            var gateways = row.sensors.lw.value.gateways;
            var maxRssi = -Infinity;
            var maxGatewayId = null;
            for (var i = 0; i < gateways.length; i++) {
              var gateway = gateways[i];
              if (gateway.hasOwnProperty("rssi") && gateway.rssi > maxRssi) {
                maxRssi = gateway.rssi;
                maxGatewayId = gateway.gateway_id;
              }
            }
            // display gateway id for the gateway with highest rssi
            if (maxGatewayId !== null) {
              return maxGatewayId;
            } else if (gateways.length > 0) {
              return gateways[0].gateway_id; // if no rssi value but at least one gateway ID, display the first one
            } else {
              return "";
            }
          }
        },
        {
          "data": null,
          "render": function(row) {
            // count the number of gateways, return an empty string if 'gateways' field is not present
            return row.sensors.lw.value.gateways ? row.sensors.lw.value.gateways.length : "";
          }
        },
        {
          "data": "tokens",
          "render": function(data, type, row) {
            if (data !== null && typeof data === "object") {
              return Object.keys(data).length;
            } else {
              return "";
            }
          }
        },
        {
          "data": "time",
          "render": function(data, type, row) {
            if (type === 'display' || type === 'filter') {
              var date = new Date(data * 1000); // Convert timestamp to Date object
              var dateString = moment(date).format('YYYY-MM-DD HH:mm:ss'); // Use moment.js to format the date string
              // var dateString = moment(date).startOf('second').fromNow(); // Use moment.js to format the date string
              return dateString;
            }
            return data;
          }
        },
        {
          "data": "sensors.bat",
          "render": function(data, type, row) {
            return (data && data.value) ? data.value : '';
          }
        },
        {
          "data": "sensors.tmp_anchor",
          "render": function(data, type, row) {
            return (data && data.value) ? data.value : '';
          }
        },
        {
          "data": "sensors.tmp_env",
          "render": function(data, type, row) {
            return (data && data.value) ? data.value : '';
          }
        },
        {
          "data": "sensors.hum",
          "render": function(data, type, row) {
            return (data && data.value) ? data.value : '';
          }
        },
        /*{
          "data": "sensors.prs",
          "render": function(data, type, row) {
            return (data && data.value) ? data.value : '';
          }
        },
        {
          "data": "sensors.voc",
          "render": function(data, type, row) {
            return (data && data.value) ? data.value : '';
          }
        },
        {
          "data": "sensors.alt",
          "render": function(data, type, row) {
            return (data && data.value) ? data.value : '';
          }
        },*/
        {
          "data": null,
          "render": function(data, type, row) {
            // find gateway with highest rssi
            var gateways = row.sensors.lw.value.gateways;
            var maxRssi = -Infinity;
            var maxGateway = null;
            for (var i = 0; i < gateways.length; i++) {
              var gateway = gateways[i];
              if (gateway.hasOwnProperty("rssi") && gateway.rssi > maxRssi) {
                maxRssi = gateway.rssi;
                maxGateway = gateway;
              }
            }
            // display rssi for the gateway with highest rssi
            if (maxGateway !== null && maxGateway.hasOwnProperty("rssi") && maxGateway.rssi !== null && maxGateway.rssi !== "") {
              return maxGateway.rssi;
            } else {
              return "";
            }
          }
        },
        {
          "data": null,
          "render": function(data, type, row) {
            // find gateway with highest rssi
            var gateways = row.sensors.lw.value.gateways;
            var maxRssi = -Infinity;
            var maxGateway = null;
            for (var i = 0; i < gateways.length; i++) {
              var gateway = gateways[i];
              if (gateway.hasOwnProperty("rssi") && gateway.rssi > maxRssi) {
                maxRssi = gateway.rssi;
                maxGateway = gateway;
              }
            }
            // display snr for the gateway with highest rssi
            if (maxGateway !== null && maxGateway.hasOwnProperty("snr")) {
              return maxGateway.snr;
            } else {
              return "";
            }
          }
        },
        {
          "data": "sensors.lw.value.framecount",
          "render": function(data, type, row) {
            return (data !== null && data !== undefined) ? data : '';
          }
        },
        {
          "data": null,
          "render": function(data, type, row) {
            var anchorId = row.tpid;
            var frameCount = row.sensors.lw.value.framecount;
            var previousFrameCount = row.sensors.lw.value.f_cnt_prev;
            var timeStamp = row.time;

            // Initialize the missed frames data for this anchor ID if it doesn't exist yet
            if (!missedFramesData[anchorId]) {
              missedFramesData[anchorId] = {
                lastTimeStamp: timeStamp,
                totalMissedFrames: 0,
                totalFrames: 0
              };
            }

            // Calculate missed frames for this row
            var missedFrames = (frameCount !== null && previousFrameCount !== null) ? frameCount - previousFrameCount - 1 : 0;

            // If the timestamp has changed, update the total missed frames and total frames for this anchor ID
            if (missedFramesData[anchorId].lastTimeStamp !== timeStamp && missedFrames >= 0) {
              missedFramesData[anchorId].totalMissedFrames += missedFrames;
              missedFramesData[anchorId].lastTimeStamp = timeStamp;

              // Update the total frames for this anchor ID
              if (previousFrameCount !== null) {
                missedFramesData[anchorId].totalFrames += frameCount - previousFrameCount;
              }
            }

            // Calculate and return the percentage of missed frames for this anchor ID, if totalFrames is greater than zero
            if (missedFramesData[anchorId].totalFrames > 0) {
              var percentageMissedFrames = (missedFramesData[anchorId].totalMissedFrames / missedFramesData[anchorId].totalFrames) * 100;
              return percentageMissedFrames.toFixed(1) + '%';
            } else {
              return '0.0%';
            }
          }
        },
        {
          "data": "sensors.lw.value.spreading_factor",
          "render": function(data, type, row) {
            return (data !== null && data !== undefined) ? data : '';
          }
        }
        /*,
                {
                  "data": "sensors.act_wucode",
                  "render": function(data, type, row) {
                    return (data && data.value) ? data.value : '';
                  }
                },
                {
                  "data": "sensors.act_pir",
                  "render": function(data, type, row) {
                    return (data && data.value) ? data.value : '';
                  }
                }*/
      ],
      "columnDefs": [{
          "title": "Anchor (TPID)",
          "targets": 0
        },
        {
          "title": "Anchor (Decimal)",
          "targets": 1
        },
        {
          "title": "Building",
          "targets": 2
        },
        {
          "title": "Floor",
          "targets": 3
        },
        {
          "title": "Zone",
          "targets": 4
        },
        {
          "title": "Gateway with max RSSI",
          "targets": 5
        },
        {
          "title": "Connected Gateways",
          "targets": 6
        },
        {
          "title": "Token Count",
          "targets": 7
        },
        {
          "title": "Time",
          "targets": 8,
          "searchBuilderType": "moment-YYYY-MM-DD HH:mm:ss"
        },
        {
          "title": "Battery",
          "targets": 9
        },
        {
          "title": "Temp (Anchor)",
          "targets": 10
        },
        {
          "title": "Temp (Environment)",
          "targets": 11
        },

        {
          "title": "Humidity",
          "targets": 12
        },
        /*{
          "title": "Pressure",
          "targets": 8
        },
        {
          "title": "VOC",
          "targets": 9
        },
        {
          "title": "Altitude",
          "targets": 10
        }, */
        {
          "title": "GW RSSI",
          "targets": 13
        },
        {
          "title": "GW SNR",
          "targets": 14
        },
        {
          "title": "Frame Count",
          "targets": 15
        },
        {
          "title": "Missed Frames",
          "targets": 16
        },
        {
          "title": "SF",
          "targets": 17
        }
        /*,
                {
                  "title": "Wake Up Code",
                  "targets": 17
                },
                {
                  "title": "Motion Detected",
                  "targets": 18
                }*/
      ],
      "lengthMenu": [
        [10, 25, 50, -1],
        [10, 25, 50, "All"]
      ],
      "dom": 'QBfrtip',
      "pageLength": -1,
      "language": {
        searchBuilder: {
          clearAll: 'Reset Filters'
        }
      },
      "buttons": [
        'copy',
        'excel',
        {
          extend: 'pdf',
          orientation: 'landscape',
          pageSize: 'A3',
          download: 'open'
        }
      ],
      // Apply good, warning, and poor colors to Time, GW RSSI, and GW SNR data
      "createdRow": function(row, data, dataIndex) {
        var now = moment();
        var anchorTime = moment($('td:eq(8)', row).text());
        var diffInMilliseconds = now.diff(anchorTime);
        var batteryValue = $('td:eq(9)', row).text();
        var rssi = $('td:eq(13)', row).text();
        var snr = $('td:eq(14)', row).text();
        if (batteryValue !== '') {
          if (batteryValue < 3) {
            $('td:eq(9)', row).addClass('poor');
          } else if (batteryValue < 3.2) {
            $('td:eq(9)', row).addClass('warning');
          }
        }
        if (anchorTime !== '') {
          if (diffInMilliseconds > 2 * 60 * 60 * 1000) {
            $('td:eq(8)', row).addClass('poor');
          } else if (diffInMilliseconds > 1 * 60 * 60 * 1000) {
            $('td:eq(8)', row).addClass('warning');
          }
        }
        if (rssi !== '') {
          rssi = parseFloat(rssi);
          if (rssi >= -105) {
            $('td:eq(13)', row).addClass('good');
          } else if (rssi > -116) {
            $('td:eq(13)', row).addClass('warning');
          } else {
            $('td:eq(13)', row).addClass('poor');
          }
        }
        if (snr !== '') {
          snr = parseFloat(snr);
          if (snr >= -5) {
            $('td:eq(14)', row).addClass('good');
          } else if (snr >= -15) {
            $('td:eq(14)', row).addClass('warning');
          } else {
            $('td:eq(14)', row).addClass('poor');
          }
        }
      }
    };

    // Initialize table
    console.log('Initializing table');
    $('#sensor-data').DataTable(tableOptions);
    // Reload data every 10 seconds
    setInterval(reloadTableData, 10000);
  });
