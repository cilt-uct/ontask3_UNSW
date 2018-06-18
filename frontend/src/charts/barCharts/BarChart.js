import React from 'react';
import { Spin } from 'antd';
import { Chart, Geom, Axis, Tooltip } from 'bizcharts';
import { View } from '@antv/data-set';

import { filterData, sortByColName, generateCountPercentField, isInt } from '../utils.js';

// Disable diagnostic tracking of BizCharts
import { track } from "bizcharts";
track(false);

class BarChart extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      dataView:null
    };
  }

  componentDidMount(){
    const {data, type, interval, range, colNameSelected, filterCols } = this.props;

    let dataView = new View().source(data);

    filterData(dataView, type, colNameSelected, filterCols, range);

    generateCountPercentField(dataView, type, interval, colNameSelected);

    sortByColName(dataView, type, colNameSelected);

    this.setState({dataView});
  }

  componentWillReceiveProps(nextProps){
    const { percentageYAxis } = this.props;

    if(percentageYAxis===nextProps.percentageYAxis && this.props!==nextProps && nextProps.show){

      let dataView = new View().source(nextProps.data);

      filterData(dataView, nextProps.type, nextProps.colNameSelected, nextProps.filterCols, nextProps.range);

      generateCountPercentField(dataView, nextProps.type, nextProps.interval, nextProps.colNameSelected);

      sortByColName(dataView, nextProps.type, nextProps.colNameSelected);

      this.setState({dataView});
    }
  }

  render(){
    const { type, percentageYAxis, interval, range, colNameSelected, numBins } = this.props;
    const { dataView } = this.state;
    let cols={};

    if(type==='number'){
      cols[colNameSelected] = numBins>20 ? 
       {max: isInt(range[1]/interval)?range[1]+interval:range[1],
        min: range[0]}
      :
       {tickInterval: interval,
        max: isInt(range[1]/interval)?range[1]+interval:range[1],
        min: range[0]}
    }

    if(percentageYAxis){
      cols['percent'] = {
        max: 1,
        formatter: val => {
          val = parseFloat(val * 100).toFixed(1) + '%';
          return val;
      }}
    }
    else{
      cols['count'] = {
        min: 0
      };
    }
      
    return(
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent:'center'}}>
        { dataView && cols ?
            percentageYAxis ? 
              <Chart height={450} width={600} data={dataView} scale={cols} padding='auto'>
                <Axis
                  name={colNameSelected} title={{offset:50}}
                  label={ type!=='number' && dataView.rows.length>10 ? 
                              {offset:5, autoRotate:false, textStyle:{rotate:90, textAlign:'start'}}
                              :
                              {autoRotate:true}}
                />
                <Axis title={{offset:70}} name= {"percent"} autoRotate={true} label={{autoRotate:false}} />
                <Tooltip/>
                <Geom type="interval" position={colNameSelected+"*percent"} />
              </Chart>
            :
              <Chart height={450} width={600} data={dataView} scale={cols} padding='auto'>
                <Axis name={colNameSelected} title={{offset:50}} autoRotate={true}
                      label={ type!=='number' && dataView.rows.length>10 ? 
                              {offset:5, autoRotate:false, textStyle:{rotate:90, textAlign:'start'}}
                              :
                              {autoRotate:true}}
                />
                <Axis title={"Count"} name= {"count"} />
                <Tooltip/>
                <Geom type="interval" position={colNameSelected+"*count"} />
              </Chart>
          :
            <Spin size="large" />
        }
      </div>
    )
  }
}

export default BarChart;