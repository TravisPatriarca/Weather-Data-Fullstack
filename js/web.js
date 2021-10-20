/**
 * @summary helper functions used across multiple pages
 * @author Travis Patriarca <trav.patriarca@gmail.com>
 *
 * Created at     : 01-04-2021 
 * Last modified  : 06-04-2021
 */

'use strict';

jQuery(function() {
    $('.div-table').hide();
    $('.div-graph').hide();

    $('#form-filter').on('submit', function(e) {
        e.preventDefault();
        if (validateForm()) {
            $('.input-error').removeClass('input-error');
            submitForm();
        }

        console.log("submit");
    });
});

function validateForm() {
    const ws = $('#wind-speed-check')[0].checked;
    const sr = $('#solar-radiation-check')[0].checked;
    const startMonth = parseInt($('#start-month').val());
    const endMonth = parseInt($('#end-month').val());
    const table = $('#table-check')[0].checked;
    const graph = $('#graph-check')[0].checked;

    if (startMonth == endMonth) {
        createInputError($('#month-selection'), "Starting month cannot be the same as the end month");
        return false;
    }

    if (endMonth < startMonth) {
        createInputError($('#month-selection'), "Starting month cannot be higher than the end month");
        return false;
    }

    if (!ws && !sr) {
        createInputError($('#measurements'), "Select measurement(s): wind speed, solar radiation or both");
        return false;
    }

    if (!table && !graph) {
        createInputError($('#output'), "Select output(s): table, graph, or both");
        return false;
    }

    return true;
}

function createGraphData(data, index, year) {
    let array = [];
    data.forEach((month, i) => {
        if (month[index] != -1) {
            let obj = {
                x: new Date(year, i),
                y: month[index]
            }
            array.push(obj);
        }
    });

    return array;
}

function createTable(ws, sr, months, data) {
    let table = $("<table/>");

    //create month headings
    let rowHeadings = $("<tr/>");
    rowHeadings.append($("<td/>"));
    for(let i=0; i<12; i++) {
        rowHeadings.append($("<th/>").text(months[i]).addClass('th-col'));
    }
    table.append(rowHeadings);

    if (ws) {
        let rowWs = $("<tr/>");
        rowWs.append($("<th/>").text('Wind Speed').addClass('th-row'));
        for(let i=0; i<12; i++) {
            data[i].ws == -1 ? rowWs.append($("<td/>")) : rowWs.append($("<td/>").text(data[i].ws.toFixed(2)));
        }

        table.append(rowWs);
    }
    
    if (sr) {
        let rowSr = $("<tr/>");
        rowSr.append($("<th/>").text('Solar Radiation').addClass('th-row'));
        for(let i=0; i<12; i++) {
            data[i].sr == -1 ? rowSr.append($("<td/>")) : rowSr.append($("<td/>").text(data[i].sr.toFixed(2)));
        }
        table.append(rowSr);
    }

    return table;
}

function createGraphDataArray(ws, sr, data, year) {
    let graphData = [];
    if (ws) {
        const wsData = createGraphData(data, 'ws', year);
        graphData.push({
            type: "line",
            showInLegend: true,
            name: "Average wind speed",
            color: "#ff4747",
            yValueFormatString: "##.## kWh/m\u00B2",
            xValueFormatString: "MMM",
            dataPoints: wsData
        })
    }

    if (sr) {
        const srData = createGraphData(data, 'sr', year);
        graphData.push({
            type: "line",
            axisYIndex: 1,
            axisYType: 'secondary',
            showInLegend: true,
            color: "#739aff",
            name: "Total solar radiation",
            yValueFormatString: "##.## km/h",
            xValueFormatString: "MMM",
            dataPoints: srData
        })
    }

    return graphData;
}

function createGraph(graphData, year) {
    var options = {
        animationEnabled: true,
        backgroundColor: null,
        title: {
            text: year + " Measurements",
            fontFamily: "calibri",
            fontWeight: "normal"
        },
        axisX:{
            interval: 1,
            intervalType: "month",
            xValueFormatString: "MMM",
            title: "Months"
        },
        axisY:{
            title: "Average wind speed (km/h)"
        },
        axisY2:{
            title: "Total solar radiation (kWh/m\u00B2)"
        },
        legend:{
            cursor:"pointer",
            verticalAlign: "top",
            horizontalAlign: "left",
            dockInsidePlotArea: true
        },
        data: graphData
    };
    return new CanvasJS.Chart('graph', options);

}

function submitForm() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = $('#year').val();
    const startMonth = $('#start-month').val();
    const endMonth = $('#end-month').val();
    
    $.ajax ({
        type: "POST",
        data: {year: year, startMonth: startMonth, endMonth: endMonth},
        url: "http://localhost:8081/weather-data",
        encode: true,
        success: function(response) {
            createStatusMsg($('#submit-status'), 0, 'Successfully retrieved data');
            let data = response;

            const ws = $('#wind-speed-check')[0].checked;
            const sr = $('#solar-radiation-check')[0].checked;
        
            $('#table-check')[0].checked ? $('.div-table').show() : $('.div-table').hide();
            $('#graph-check')[0].checked ? $('.div-graph').show() : $('.div-graph').hide();
        
            let table = createTable(ws, sr, months, data);
            $('#table').html(table);
            
            const graphData = createGraphDataArray(ws, sr, data, year);
            let graph = createGraph(graphData, year);
            graph.render();
            
        },
        error: function(request, status, error) {
            console.log(error);
            createStatusMsg($('#submit-status'), 1, status + ': failed to retrieve data!');
        }
    })
}

//create error for invalid input
function createInputError(element, msg) {
    $(element).addClass('input-error');
    createStatusMsg($('#submit-status'), true, msg);

    return false;
}

//create status message for success or failed form submit
function createStatusMsg(element, fail, msg) {
    if (fail) {
        $(element).removeClass('status-success');
        $(element).addClass('status-fail');
    }
    else
    {
        $(element).removeClass('status-fail');
        $(element).addClass('status-success');
    }

    $(element).html(msg);
}