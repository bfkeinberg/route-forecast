let React = require('react'),
Button = require('react-bootstrap').Button,
Table = require('react-bootstrap').Table,
Well = require('react-bootstrap').Well;

class ForecastTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    static expandTable(forecast) {
        if (forecast['forecast']!= null) {
            return (
                <tbody>
                {forecast['forecast'].map((point, index, data) =>
                    <tr key={point[0]}>
                        <td>{point[0]}</td>
                        <td>{point[1]}</td>
                        <td>{point[2]}</td>
                        <td>{point[3]}</td>
                        <td>{point[4]}</td>
                        <td>{point[5]}</td>
                    </tr>
                )}
                </tbody>
            );
        }
    }

    render() {
        return (
            <Well>
                <Table striped condensed hover bordered>
                    <thead>
                    <tr>
                        <th style={{'fontSize':'80%'}}>Time</th>
                        <th style={{'fontSize':'80%'}}>Summary</th>
                        <th style={{'fontSize':'80%'}}>Temperature</th>
                        <th style={{'fontSize':'80%'}}>Chance of rain</th>
                        <th style={{'fontSize':'80%'}}>Cloud cover</th>
                        <th style={{'fontSize':'80%'}}>Wind speed</th>
                    </tr>
                    </thead>
                    {ForecastTable.expandTable(this.props.forecast)}
                </Table>
                <Button href="https://darksky.net/poweredby/" bsClass="darkSkyLogo"> </Button>
            </Well>
        );
    }
}


/*<DateTimePicker name="starting_time" value={this.state.start}
                placeholder="Select Date.."
                onChange={event => this.setState({start:event.target.value})}/>
DateTimePicker = require('react-datetimepicker-bootstrap');
setupDate() {
    const now = new Date();
    let later = new Date();
    const daysToAdd = 14;
    later.setDate(now.getDate() + daysToAdd);
    let datetimeElement = document.getElementById('starting_time');
    if (datetimeElement != null) {
        calendar = datetimeElement.flatpickr({
            enableTime: true,
            altInput: true,
            altFormat: "F j, Y h:i K",
            altInputClass: "dateDisplay",
            minDate: now,
            maxDate: later,
            defaultDate: now,
            dateFormat: "Y-m-d\TH:i"
        });
    }
}*/


module.exports=ForecastTable;