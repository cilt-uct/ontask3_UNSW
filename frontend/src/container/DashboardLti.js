import React from "react";
import {
  Layout,
  Icon,
  Button,
  Spin,
  Modal,
  Select,
  Tooltip,
  List,
  Collapse,
  notification,
  Menu,
  Card
} from "antd";
import _ from "lodash";

import ContainerModal from "./ContainerModal";
import ContainerShare from "./ContainerShare";
import AccessListModal from "./AccessListModal";

import DatasourceTab from "./tabs/DatasourceTab";
import DataLabTab from "./tabs/DataLabTab";
import ActionTab from "./tabs/ActionTab";

import ContainerContext from "./ContainerContext";

import apiRequest from "../shared/apiRequest";

import "./Container.css";

const { Content } = Layout;
const Panel = Collapse.Panel;

class DashboardLti extends React.Component {
  state = {
    dashboard: [],
    container: { visible: false, selected: null },
    sharing: { visible: false, selected: null },
    lti: { visible: false },
    deleting: {},
    formPermissions: {}
  };

  fetchDashboard = () => {
    this.setState({ fetching: true });

    apiRequest(`/dashboard/lti/`, {
      method: "GET",
      onSuccess: dashboard => {
        let accordionKey = sessionStorage.getItem("accordionKey");
        let tabKey = sessionStorage.getItem("tabKey");

        if ((!accordionKey || !tabKey) && dashboard.length > 0)
          this.setDefaultKeys(dashboard[0].id);

        this.setState({
          dashboard,
          fetching: false,
          accordionKey,
          tabKey
        });
      },
      onError: () => {
        notification["error"]({
          message: "Failed to fetch dashboard"
        });
        this.setState({ fetching: false });
      }
    });
  };

  componentDidMount() {
    this.fetchDashboard();
  }

  componentDidUpdate(prevProps) {
    const { ltiContainerId, ltiResourceId } = this.props;
    const { dashboard, didSetKeys } = this.state;

    if (ltiContainerId && dashboard.length > 0 && !didSetKeys) {
      const associatedContainer = dashboard.find(
        container => container.id === ltiContainerId
      );
      if (associatedContainer) this.setDefaultKeys(associatedContainer.id);
      this.setState({ didSetKeys: true });
    }

    if (ltiResourceId !== prevProps.ltiResourceId) {
      this.setState({ lti: { visible: true } });
    }
  }

  openModal = ({ type, selected, data }) => {
    // Opens a model of the specified type
    // E.g. create/edit container, modify sharing permissions of a container
    this.setState({
      [type]: {
        visible: true,
        selected,
        data
      }
    });
  };

  closeModal = type => {
    // Close the model of the specified type, and clear the parameters
    this.setState({
      [type]: {
        visible: false,
        selected: null,
        data: {}
      }
    });
  };

  setDefaultKeys = containerId => {
    const { dashboard } = this.state;

    const container = dashboard.find(container => container.id === containerId);

    let tabKey;
    if (container) {
      tabKey = container.has_full_permission
        ? "datasources"
        : ["shared_datalabs", "information_submission"].find(
            type => container[type].length > 0
          );

      this.setState({ accordionKey: containerId, tabKey });
      sessionStorage.setItem("accordionKey", containerId);
      sessionStorage.setItem("tabKey", tabKey);
    } else {
      this.setState({ accordionKey: null, tabKey: null });
      sessionStorage.removeItem("accordionKey");
      sessionStorage.removeItem("tabKey");
    }
  };

  ContainerList = () => {
    const { history } = this.props;
    const { accordionKey, tabKey, dashboard } = this.state;

    return (
      <div>
          {dashboard.map((container, i) => (
              <div style={{ display: "flex" }}>
                <Menu
                  mode="inline"
                  selectedKeys={[tabKey]}
                  onSelect={e => {
                    const tabKey = e.key;
                    this.setState({ tabKey });
                    sessionStorage.setItem("tabKey", tabKey);
                  }}
                  style={{ maxWidth: 250 }}
                >
                  {container.has_full_permission && [
                    <Menu.Item key="datasources">
                      Datasources ({container.datasources.length})
                    </Menu.Item>,
                    <Menu.Item key="datalabs">
                      DataLabs ({container.datalabs.length})
                    </Menu.Item>,
                    <Menu.Item key="actions">
                      Actions ({container.actions.length})
                    </Menu.Item>
                  ]}

                  {container.has_full_permission &&
                    ["shared_datalabs", "information_submission"].some(
                      type => container[type].length > 0
                    ) && <Menu.Divider />}

                  {container.shared_datalabs.length > 0 && (
                    <Menu.Item key="shared_datalabs">
                      Shared DataLabs ({container.shared_datalabs.length})
                    </Menu.Item>
                  )}

                  {container.information_submission.length > 0 && (
                    <Menu.Item key="information_submission">
                      Information Submission (
                      {container.information_submission.length})
                    </Menu.Item>
                  )}
                </Menu>

                <div style={{ flex: 1, margin: "4px 0 0 20px" }}>
                  {container.has_full_permission &&
                    tabKey === "datasources" && (
                      <DatasourceTab
                        containerId={container.id}
                        datasources={container.datasources}
                      />
                    )}

                  {container.has_full_permission && tabKey === "datalabs" && (
                    <DataLabTab
                      containerId={container.id}
                      datasources={container.datasources}
                      dataLabs={container.datalabs}
                    />
                  )}

                  {container.has_full_permission && tabKey === "actions" && (
                    <ActionTab
                      containerId={container.id}
                      dataLabs={container.datalabs}
                      actions={container.actions}
                    />
                  )}
                </div>
              </div>
          ))}
      </div>
    );
  };

  render() {
    const { history } = this.props;
    const {
      fetching,
      dashboard,
      container,
      sharing,
      lti,
      accessList
    } = this.state;

    return (
      <ContainerContext.Provider
        value={{
          fetchDashboard: this.fetchDashboard,
          history
        }}
      >
        <div className="container">
          <Content className="wrapper">
            <Layout className="layout">
              <Content className="content">
                {fetching ? (
                  <Spin size="large" />
                ) : (
                  <div>
                    {dashboard.length > 0 ? (
                      this.ContainerList()
                    ) : sessionStorage.getItem("group") === "user" ? (
                      <h2>
                        You have not received any correspondence via OnTask.
                      </h2>
                    ) : (
                      <h2>
                        <Icon type="info-circle-o" className="info_icon" />
                        Get started by creating your first container.
                      </h2>
                    )}
                  </div>
                )}
              </Content>
            </Layout>
          </Content>
        </div>
      </ContainerContext.Provider>
    );
  }
}

export default DashboardLti;
