var React = require("react");
var ReactDOM = require("react-dom");
var router = require("react-router");

var Router = router.Router;
var Route = router.Route;
var browserHistory = router.browserHistory;
var hashHistory = router.hashHistory;


/* var Select = require('react-select');
   require('react-select/dist/react-select.css'); */

var Select = require('react-virtualized-select').default;
require('react-virtualized/styles.css');
require('react-select/dist/react-select.css');
require('react-virtualized-select/styles.css');

require('./style.less');


var planner = require('./planner.js');
var convertToConstraint = planner.convertToConstraint;

function loadJSON(callback) {

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'schedule-grouped.json', true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

var dict_zip = function (key_array, val_array) {
    if (key_array.length === val_array.length) {
        var obj = {};
        var len = key_array.length;

        for (var i = 0;i < len; i++) {
            obj[key_array[i]] = val_array[i];
        }
        return obj;
    } else {
        console.log("dict_zip bad args length");
    }
}


var ClassList = React.createClass({
    getInitialState: function() {
        return {pickedItems: {}}
    },

    updatePickedItems: function(items) {
        var pickedItems = this.state.pickedItems;
        for(var i=0; i < items.length; i += 1) {
            var value = items[i]['value'];
            if(pickedItems[value] === undefined) {
                pickedItems[value] = true;
            }
        }
        this.setState({pickedItems: pickedItems});

        this.props.updatePickedItems(pickedItems);
    },
    
    componentWillReceiveProps: function(nextProps) {
        if(nextProps['items']) {
            this.updatePickedItems(nextProps['items']);
        }
    },

    checkItem: function(e) {
        var target = $(e['target']);
        var value = target.attr('value');

        var pickedItems = this.state.pickedItems;
        pickedItems[value] = !pickedItems[value];
        this.setState({pickedItems: pickedItems});

        this.props.updatePickedItems(pickedItems);
    },
    
    render: function() {
        var items = this.props.items.map(function(item) {
            var d = item['data'][0];
            var value = item['value'];
            var title = d['Subject'] + ' ' + d['Catalog Number'];
            var name = d['Course Title'];
            var checked = this.state.pickedItems[value];
            return (
                <div key={value}>
                    <input type="checkbox" value={value}
                           checked={checked} onChange={this.checkItem}/>
                    {title} -- {name}
                </div>
            );
        }.bind(this));

        return (
            <div className="ClassList">
                <div> Classes </div>
                <div>
                    {items}
                </div>
            </div>
        );
    }
});

var ClassPicker = React.createClass({
    onChange: function(val) {
        console.log(val);
        if(val == null) {
            this.setState({value: undefined});
        } else {
            var items = this.state.items;
            var items_dict = this.state.items_dict;
            if(!items_dict[val['value']]) {
                items_dict[val['value']] = val;
                items.push(val);
            }
            this.setState({value: val['value'], items: items, items_dict: items_dict});
        }
    },

    updateOptions: function(data) {
        var options = [];
        var rows = Object.keys(data);

        var titles = {};

        for(var i=0; i < rows.length; i += 1) {
            var d = data[rows[i]][0];
            var title = d['Subject'] + ' ' + d['Catalog Number'];
            var option = {value: rows[i], label: title, data: data[rows[i]]};
            options.push(option);
        }

        this.setState({options: options});
        console.log('loaded');
    },


    getInitialState: function() {
        return {value: undefined, options: [], items: [], items_dict: {}};
    }
    ,
    componentWillReceiveProps: function(nextProps) {
        if(nextProps['data']) {
            this.updateOptions(nextProps['data']);
        }
    },

    getPickedItems: function() {
        var out = [];
        var pickedItems = this.pickedItems;
        var items = this.state.items;
        
        for(var i=0; i < items.length; i += 1) {
            var item = items[i];
            var value = item['value'];
            if(pickedItems[value]) {
                out.push(item);
            }
        }
        return out;
    },
    
    componentDidMount: function() {
        $('#generate').click(function() {
            this.props.onGenerate(this.getPickedItems());
        }.bind(this));
    },

    updatePickedItems: function(pickedItems) {
        this.pickedItems = pickedItems;
    },
    
    render: function() {
        var options = this.state.options;

        return (
            <div className="ClassPicker">
                <Select value={this.state.value}
                        options={options}
                        onChange={this.onChange}
                />
                <ClassList items={this.state.items} updatePickedItems={this.updatePickedItems} />
                <button id="generate" type="button">Generate schedules!</button>
            </div>
        );
    }
});


var Calendar = React.createClass({
    render: function() {
        return (
            <div className="Calendar">
                Calendar
            </div>
        );
    }

});

var App = React.createClass({
    componentDidMount: function() {
        this.loadData();
    },

    loadData: function() {
        // Parse JSON string into object
        loadJSON(function(response) {
            var data = JSON.parse(response);
            window.data = data;
            this.setState({'data': data});
        }.bind(this));
    },

    getInitialState: function() {
        return {data: null};
    },

    onGenerate: function(items) {
        convertToConstraint(items);
    },

    render: function() {
        return (
            <div>
                <ClassPicker data={this.state.data} onGenerate={this.onGenerate} />
                <Calendar />
            </div>
        );
    }
});

/* ReactDOM.render((
   <Router history={hashHistory}>
   <Route path="/" component={App} />
   </Router>
   ), document.getElementById('app')) */

ReactDOM.render(<App/>, document.getElementById('app'));
