import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Layout, Breadcrumb, Icon, Button, Spin } from 'antd';

import * as ContainerActionCreators from './ContainerActions';

import ContainerModal from './ContainerModal';
import ContainerList from './ContainerList';
import DatasourceModal from '../datasource/DatasourceModal';
import ViewModal from '../view/ViewModal';
import WorkflowModal from '../workflow/WorkflowModal';

const { Content } = Layout;


class Container extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch } = props;

    this.boundActionCreators = bindActionCreators(ContainerActionCreators, dispatch);
  }

  componentDidMount() {
    this.boundActionCreators.fetchContainers();
  };

  render() {
    const { dispatch, isFetching, containers } = this.props;

    return (
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item><Link to="/">Dashboard</Link></Breadcrumb.Item>
          <Breadcrumb.Item>Containers</Breadcrumb.Item>
        </Breadcrumb>
        <Layout style={{ padding: '24px 0', background: '#fff' }}>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            <h1>Containers</h1>
          { isFetching ?
            <Spin size="large" />
          :
            <div>
              <Button
                onClick={() => { dispatch(this.boundActionCreators.openContainerModal()) }}
                type="primary" icon="plus" size="large" style={{ marginBottom: '20px' }}
              >
                New container
              </Button>

              <ContainerModal/>
              
              { containers && containers.length > 0 ?
                <div>
                  <WorkflowModal/>
                  <DatasourceModal/>
                  <ViewModal/>

                  <ContainerList/>
                </div>
              :
                <h2>
                  <Icon type="info-circle-o" style={{ marginRight: '10px' }}/>
                  Get started by creating your first container.
                </h2>
              }
            </div>
          }
          </Content>
        </Layout>
      </Content>
    );
  };

};

const mapStateToProps = (state) => {
  const {
    isFetching, containers
  } = state.containers;
  
  return {
    isFetching, containers
  };
}

export default connect(mapStateToProps)(Container)
