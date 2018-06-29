import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Switch, Route } from "react-router-dom";
import { Spin, Layout, Breadcrumb, Icon, Radio } from "antd";
import { DragDropContext } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import _ from "lodash";

import * as DataLabActionCreators from "./DataLabActions";

import "./DataLab.css";

import Model from "./interfaces/Model";
import Details from "./interfaces/Details";
import Data from "./interfaces/Data";

const { Content } = Layout;
const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class DataLab extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(
      DataLabActionCreators,
      dispatch
    );
  }

  componentDidMount() {
    const { match, location, history } = this.props;

    if (location.state && "containerId" in location.state) {
      // User pressed "Create DataLab", as the containerId is only set in the
      // location state when the navigation occurs
      this.boundActionCreators.fetchDatasources(location.state.containerId);
    } else if (match.params.id) {
      this.boundActionCreators.fetchDataLab(match.params.id);
    } else {
      // The user must have cold-loaded the URL, so we have no container to reference
      // Therefore redirect the user back to the container list
      history.push("/containers");
    }
  }

  render() {
    const { isFetching, selectedId, match, history, location } = this.props;

    return (
      <div className="dataLab">
        <Content className="wrapper">
          <Breadcrumb className="breadcrumbs">
            <Breadcrumb.Item>
              <Link to="/">Dashboard</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/containers">Containers</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>DataLab</Breadcrumb.Item>
          </Breadcrumb>

          <Layout className="layout">
            <Content className="content">
              <div className="heading">
                <h1>{`${selectedId ? "Update" : "Create"} DataLab`}</h1>
                <Link to="/containers">
                  <Icon type="arrow-left" />
                  <span>Back to containers</span>
                </Link>
              </div>

              {selectedId && (
                <div className="actions">
                  <RadioGroup
                    size="large"
                    onChange={e =>
                      history.push(`${match.url}/${e.target.value}`)
                    }
                    value={location.pathname.split("/").slice(-1)[0]}
                  >
                    <RadioButton value="data">Data</RadioButton>
                    <RadioButton value="details">Details</RadioButton>
                    <RadioButton value="model">Model</RadioButton>
                  </RadioGroup>
                </div>
              )}

              {isFetching ? (
                <Spin size="large" />
              ) : (
                <Switch>
                  <Route exact path={`${match.url}`} component={Model} />
                  <Route path={`${match.url}/model`} component={Model} />
                  <Route path={`${match.url}/details`} component={Details} />
                  <Route path={`${match.url}/data`} component={Data} />
                </Switch>
              )}
            </Content>
          </Layout>
        </Content>
      </div>
    );
  }
}

const mapStateToProps = state => {
  const { isFetching, selectedId } = state.dataLab;

  return {
    isFetching,
    selectedId
  };
};

export default _.flow(
  connect(mapStateToProps),
  DragDropContext(HTML5Backend)
)(DataLab);
