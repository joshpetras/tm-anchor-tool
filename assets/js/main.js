  var missedFramesData = {};

  function reloadTableData() {
    $('#sensor-data').DataTable().ajax.reload(null, false);
  }

  $(document).ready(function() {
    console.log('Document ready');
    // Store the API endpoint
    var apiEndpoint = "https://prd.tcs31.sostark.nl/api/anchors";

    // Get the current date and time when the query is initiated
    var initialDate = new Date();
    var dateString = moment(initialDate).format('YYYY-MM-DD HH:mm:ss'); // Use moment.js to format the date string

    // Add event listener to reset button
    $('#reset-btn').on('click', function() {
      missedFramesData = {}; // Reset missed frames data
      $('#sensor-data').DataTable().ajax.reload(null, false); // Reload table data without resetting searchbuilder filters
    });

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
        }
      },
      "columns": [{
          "data": "tpid"
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
        /*{
          "data": "sensors.hum",
          "render": function(data, type, row) {
            return (data && data.value) ? data.value : '';
          }
        },
        {
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
                totalMissedFrames: 0
              };
            }

            // Calculate missed frames for this row
            var missedFrames = (frameCount !== null && previousFrameCount !== null) ? frameCount - previousFrameCount - 1 : 0;

            // If the timestamp has changed, update the total missed frames for this anchor ID
            if (missedFramesData[anchorId].lastTimeStamp !== timeStamp) {
              missedFramesData[anchorId].totalMissedFrames += missedFrames;
              missedFramesData[anchorId].lastTimeStamp = timeStamp;
            }

            // Return the total missed frames for this anchor ID
            return missedFramesData[anchorId].totalMissedFrames;
          }
        },
        {
          "data": "sensors.lw.value.spreading_factor",
          "render": function(data, type, row) {
            return (data !== null && data !== undefined) ? data : '';
          }
        },
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
        }
      ],
      "columnDefs": [{
          "title": "Anchor",
          "targets": 0
        },
        {
          "title": "Gateway with max RSSI",
          "targets": 1
        },
        {
          "title": "Connected Gateways",
          "targets": 2
        },
        {
          "title": "Token Count",
          "targets": 3
        },
        {
          "title": "Time",
          "targets": 4
        },
        {
          "title": "Battery",
          "targets": 5
        },
        {
          "title": "Temp (Anchor)",
          "targets": 6
        },
        {
          "title": "Temp (Environment)",
          "targets": 7
        },
        /*
                 {
                   "title": "Humidity",
                   "targets": 7
                 },
                 {
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
          "targets": 8
        },
        {
          "title": "GW SNR",
          "targets": 9
        },
        {
          "title": "Frame Count",
          "targets": 10
        },
        {
          "title": "Missed Frames",
          "targets": 11
        },
        {
          "title": "SF",
          "targets": 12
        },
        {
          "title": "Wake Up Code",
          "targets": 13
        },
        {
          "title": "Motion Detected",
          "targets": 14
        }
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
          orientation: 'landscape'
        }
      ],

      "createdRow": function(row, data, dataIndex) {
        var rssi = $('td:eq(8)', row).text();
        var snr = $('td:eq(9)', row).text();
        if (rssi !== '') {
          rssi = parseFloat(rssi);
          if (rssi >= -105) {
            $('td:eq(8)', row).addClass('good');
          } else if (rssi > -116) {
            $('td:eq(8)', row).addClass('warning');
          } else {
            $('td:eq(8)', row).addClass('poor');
          }
        }
        if (snr !== '') {
          snr = parseFloat(snr);
          if (snr >= -5) {
            $('td:eq(9)', row).addClass('good');
          } else if (snr >= -15) {
            $('td:eq(9)', row).addClass('warning');
          } else {
            $('td:eq(9)', row).addClass('poor');
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
