import React from 'react';

import { Modal, Form, Input, Alert, Select, Button, Upload, Icon, message} from 'antd';

const FormItem = Form.Item;
const { TextArea } = Input;
const Option = Select.Option;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};


const handleOk = (form, containerId, datasource, onCreate, onUpdate, uploadingFile) => {
  form.validateFields((err, values) => {
    if (err) {
      return;
    }
    if (datasource) {
      onUpdate(datasource.id, values, uploadingFile);
    } else {
      values['dbType'] = values.connection.dbType;
      if (values.connection.dbType==='csv' && uploadingFile===undefined) {
        message.error('Please add CSV file');
      }else{
        onCreate(containerId, values, uploadingFile)
      }
    }
  });
}

const handleChange = (selectedId, onChange, form, datasources) => {
  form.resetFields();
  const datasource = datasources.find(datasource => { return datasource.id === selectedId });
  if(datasource && datasource.connection.dbType==='csv'){
    onChange(datasource, true);
  }
  else{
    onChange(datasource, false);
  }
}

const handleDatasourceTypeSelction = (selected, onSelect) => {
  if(selected==='csv'){
    onSelect(true);
  }
  else{
    onSelect(false);
  }
}

//actions for interacting with datasource form uploading file list
const Dragger = Upload.Dragger;

const fileValidation = (file) => {
  const isCSV = file.type === 'text/csv';
  if (!isCSV) {
    message.error('You can only upload CSV file!');
  }
  console.log(file.size / (1024*1024))
  const isLt2G = file.size / (1024*1024) < 2;
  if (!isLt2G) {
    message.error('File must smaller than 2GB!');
  }
  return isCSV && isLt2G;
};

const handleDraggerChange = (info, addUploadingFile) => {
  if (fileValidation(info.file)){
    addUploadingFile(info.file);
  }
};

const DatasourceModal = ({
  form, visible, loading, error, containerId, datasources,
  datasource, onChange, onCreate, onUpdate, onCancel, onDelete,
  uploadingFile, uploadCsvFile, addUploadingFile, onSelect
}) => (
  <Modal
    visible={visible}
    title='Datasources'
    okText={datasource ? 'Update' : 'Create'}
    onCancel={() => { form.resetFields(); onCancel(); }}
    onOk={() => { handleOk(form, containerId, datasource, onCreate, onUpdate, uploadingFile) }}
    confirmLoading={loading}
  >
    {uploadCsvFile ?
      <Form layout="horizontal">
        <FormItem
          {...formItemLayout}
          label="Datasource"
        >
          <div style={{ display: 'inline-flex', width: '100%' }}>
            <Select value={datasource ? datasource.id : null} onChange={(selected) => { handleChange(selected, onChange, form, datasources) }} defaultValue={null}>
              <Option value={null} key={0}><i>Create new datasource</i></Option>
              { datasources ? datasources.map((datasource) => {
                return <Option value={datasource.id} key={datasource.name}>{datasource.name}</Option>
              }) : ''}
            </Select>
            <Button disabled={datasource ? false : true} onClick={() => { onDelete(datasource.id) }} type="danger" icon="delete" style={{ marginLeft: '10px' }}/>
          </div>
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Database type"
        >
          {form.getFieldDecorator('connection.dbType', {
            initialValue: datasource ? datasource.connection.dbType : null,
            rules: [{ required: true, message: 'Database type is required' }]
          })(
            <Select onChange={(selected) => handleDatasourceTypeSelction(selected, onSelect)}>
              <Option value="mysql">MySQL</Option>
              <Option value="postgresql">PostgreSQL</Option>
              <Option value="csv">CSV File</Option>
              <Option value="sqlite" disabled>SQLite</Option>
              <Option value="mssql" disabled>MSSQL</Option>
            </Select>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Name"
        >
          {form.getFieldDecorator('name', {
            initialValue: datasource ? datasource.name : null,
            rules: [{ required: true, message: 'Name is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        <Dragger
          name = 'file'
          multiple = {false}
          action = ''
          onChange = {(info) => handleDraggerChange(info, addUploadingFile)}
          beforeUpload = {() => {return false}}
        >
          <p className="ant-upload-drag-icon">
            <Icon type="inbox" />
          </p>
          <p className="ant-upload-text">Click or drag CSV file to this area to upload</p>
          <p className="ant-upload-hint">Support for a single or bulk upload.</p>
        </Dragger>
        {uploadingFile ?
          <span><Icon type='paper-clip'/>{uploadingFile.name}</span>
          :
          <br/>
        }
        { error && <Alert message={error} type="error"/>}
      </Form>
      :
      <Form layout="horizontal">
        <FormItem
          {...formItemLayout}
          label="Datasource"
        >
          <div style={{ display: 'inline-flex', width: '100%' }}>
            <Select value={datasource ? datasource.id : null} onChange={(selected) => { handleChange(selected, onChange, form, datasources) }} defaultValue={null}>
              <Option value={null} key={0}><i>Create new datasource</i></Option>
              { datasources ? datasources.map((datasource) => {
                return <Option value={datasource.id} key={datasource.name}>{datasource.name}</Option>
              }) : ''}
            </Select>
            <Button disabled={datasource ? false : true} onClick={() => { onDelete(datasource.id) }} type="danger" icon="delete" style={{ marginLeft: '10px' }}/>
          </div>
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Database type"
        >
          {form.getFieldDecorator('connection.dbType', {
            initialValue: datasource ? datasource.connection.dbType : null,
            rules: [{ required: true, message: 'Database type is required' }]
          })(
            <Select onChange={(selected) => handleDatasourceTypeSelction(selected, onSelect)}>
              <Option value="mysql">MySQL</Option>
              <Option value="postgresql">PostgreSQL</Option>
              <Option value="csv">CSV File</Option>
              <Option value="sqlite" disabled>SQLite</Option>
              <Option value="mssql" disabled>MSSQL</Option>
            </Select>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Name"
        >
          {form.getFieldDecorator('name', {
            initialValue: datasource ? datasource.name : null,
            rules: [{ required: true, message: 'Name is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Host"
        >
          {form.getFieldDecorator('connection.host', {
            initialValue: datasource ? datasource.connection.host : null,
            rules: [{ required: true, message: 'Host is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Database"
        >
          {form.getFieldDecorator('connection.database', {
            initialValue: datasource ? datasource.connection.database : null,
            rules: [{ required: true, message: 'Database is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="User"
        >
          {form.getFieldDecorator('connection.user', {
            initialValue: datasource ? datasource.connection.user : null,
            rules: [{ required: true, message: 'Database user is required' }]
          })(
            <Input/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Password"
        >
          {form.getFieldDecorator('connection.password', {
            rules: [{ required: datasource ? false : true, message: 'Database password is required' }]
          })(
            <Input type="password" placeholder={datasource ? 'Change password' : ''}/>
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
          label="Query"
        >
          {form.getFieldDecorator('connection.query', {
            initialValue: datasource ? datasource.connection.query : null,
            rules: [{ required: true, message: 'Database query is required' }]
          })(
            <TextArea rows={2}/>
          )}
        </FormItem>
        { error && <Alert message={error} type="error"/>}
      </Form>
    }
    </Modal>
)

export default Form.create()(DatasourceModal)
