import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import {
  Button,
  Divider,
  Menu,
  Dropdown,
  Alert,
  Popconfirm,
  Input,
  Popover,
  Tooltip,
  Table
} from "antd";

import { Editor, getEventTransfer } from "slate-react";
import Html from "slate-html-serializer";
import SoftBreak from "slate-soft-break";
import { Value } from "slate";
import { isKeyHotkey } from "is-hotkey";

import _ from "lodash";
import Draggable from "react-draggable";

import * as ActionActionCreators from "../ActionActions";

import FilterModal from "../modals/FilterModal";
import ConditionGroupModal from "../modals/ConditionGroupModal";
import PreviewModal from "../modals/PreviewModal";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import "material-design-icons/iconfont/material-icons.css";

const DEFAULT_NODE = "paragraph";

const plugins = [SoftBreak({ shift: true })];

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: "block",
        type: "paragraph",
        nodes: [
          {
            object: "text",
            leaves: [
              {
                text: ""
              }
            ]
          }
        ]
      }
    ]
  }
});

const isBoldHotkey = isKeyHotkey("mod+b");
const isItalicHotkey = isKeyHotkey("mod+i");
const isUnderlinedHotkey = isKeyHotkey("mod+u");
const isCodeHotkey = isKeyHotkey("mod+`");

const generateColours = size => {
  let colours = new Array(size);

  const sin_to_hex = (i, phase) => {
    const sin = Math.sin((Math.PI / size) * 2 * i + phase);
    const int = Math.floor(sin * 127) + 128;
    const hex = int.toString(16);

    return hex.length === 1 ? "0" + hex : hex;
  };

  for (var i = 0; i < size; i++) {
    var red = sin_to_hex(i, (0 * Math.PI * 2) / 3); // 0   deg
    var blue = sin_to_hex(i, (1 * Math.PI * 2) / 3); // 120 deg
    var green = sin_to_hex(i, (2 * Math.PI * 2) / 3); // 240 deg

    colours[i] = "#" + red + green + blue;
  }

  return colours;
};

class Compose extends React.Component {
  constructor(props) {
    super(props);
    const { dispatch, action } = props;

    this.boundActionCreators = bindActionCreators(
      ActionActionCreators,
      dispatch
    );

    this.state = {
      isInside: false,
      value:
        "content" in action && action["content"]
          ? Value.fromJSON(action["content"])
          : initialValue,
      colours: generateColours(action.conditionGroups.length),
      preview: {
        visible: false,
        loading: false,
        populatedContent: []
      },
      visible: { filter: false, conditionGroup: false },
      contentLoading: false,
      hyperlink: { label: null, url: null },
      image: { src: null, alt: null }
    };
  }

  componentDidUpdate(prevProps) {
    const { action } = this.props;

    if (
      prevProps.action.conditionGroups.length < action.conditionGroups.length
    ) {
      this.setState({
        colours: generateColours(action.conditionGroups.length)
      });
    }
  }

  renderMarkButton = (type, icon) => {
    const isActive = this.hasMark(type);

    return (
      <i
        className={`material-icons ${isActive ? "active" : ""}`}
        onMouseDown={event => this.onClickMark(event, type)}
      >
        {icon}
      </i>
    );
  };

  renderBlockButton = (type, icon) => {
    let isActive = this.hasBlock(type);

    if (["numbered-list", "bulleted-list"].includes(type)) {
      const { value } = this.state;
      const parent = value.document.getParent(value.blocks.first().key);
      isActive = this.hasBlock("list-item") && parent && parent.type === type;
    }

    return (
      <i
        className={`material-icons ${isActive ? "active" : ""}`}
        onMouseDown={event => this.onClickBlock(event, type)}
      >
        {icon}
      </i>
    );
  };

  hasMark = type => {
    const { value } = this.state;
    return value.activeMarks.some(mark => mark.type === type);
  };

  onClickMark = (event, type, data) => {
    event.preventDefault();
    const { value } = this.state;
    const change = value.change().toggleMark({ type, data });
    this.onChange(change);
  };

  renderMark = props => {
    const { children, mark, attributes } = props;

    switch (mark.type) {
      case "bold":
        return <strong {...attributes}>{children}</strong>;
      case "code":
        return <code {...attributes}>{children}</code>;
      case "italic":
        return <em {...attributes}>{children}</em>;
      case "underlined":
        return <u {...attributes}>{children}</u>;
      default:
        return;
    }
  };

  hasBlock = type => {
    const { value } = this.state;
    return value.blocks.some(node => node.type === type);
  };

  onClickBlock = (event, type) => {
    event.preventDefault();
    const { value } = this.state;
    const change = value.change();
    const { document } = value;

    // Handle everything but list buttons.
    if (type !== "bulleted-list" && type !== "numbered-list") {
      const isActive = this.hasBlock(type);
      const isList = this.hasBlock("list-item");

      if (isList) {
        change
          .setBlocks(isActive ? DEFAULT_NODE : type)
          .unwrapBlock("bulleted-list")
          .unwrapBlock("numbered-list");
      } else {
        change.setBlocks(isActive ? DEFAULT_NODE : type);
      }
    } else {
      // Handle the extra wrapping required for list buttons.
      const isList = this.hasBlock("list-item");
      const isType = value.blocks.some(block => {
        return !!document.getClosest(block.key, parent => parent.type === type);
      });

      if (isList && isType) {
        change
          .setBlocks(DEFAULT_NODE)
          .unwrapBlock("bulleted-list")
          .unwrapBlock("numbered-list");
      } else if (isList) {
        change
          .unwrapBlock(
            type === "bulleted-list" ? "numbered-list" : "bulleted-list"
          )
          .wrapBlock(type);
      } else {
        change.setBlocks("list-item").wrapBlock(type);
      }
    }

    this.onChange(change);
  };

  renderNode = props => {
    const { colours } = this.state;
    const { attributes, children, node } = props;

    switch (node.type) {
      case "paragraph":
        return <p {...attributes}>{children}</p>;
      case "bulleted-list":
        return <ul {...attributes}>{children}</ul>;
      case "heading-one":
        return <h1 {...attributes}>{children}</h1>;
      case "heading-two":
        return <h2 {...attributes}>{children}</h2>;
      case "list-item":
        return <li {...attributes}>{children}</li>;
      case "numbered-list":
        return <ol {...attributes}>{children}</ol>;
      case "link":
        let href = node.data.get("href");
        if (!(href.startsWith("http://") || href.startsWith("https://")))
          href = `//${href}`;
        return (
          <Popover
            content={
              <div>
                {/* <Tooltip title="Edit link">
                  <i
                    style={{ cursor: "pointer", marginRight: 5 }}
                    className="material-icons"
                  >
                    create
                  </i>
                </Tooltip> */}
                <Tooltip title="Go to link">
                  <a
                    href={href}
                    target="_blank"
                    style={{ color: "rgba(0, 0, 0, 0.65)" }}
                  >
                    <i className="material-icons">public</i>
                  </a>
                </Tooltip>
              </div>
            }
          >
            <a {...attributes}>{children}</a>
          </Popover>
        );
      case "image":
        const src = node.data.get("src");
        const alt = node.data.get("alt");
        return (
          <img
            {...attributes}
            src={src}
            alt={alt}
            style={{ maxWidth: "100%" }}
          />
        );
      case "condition":
        const name = node.data.get("name");
        const group = node.data.get("group");
        return (
          <div
            className="condition_block"
            style={{ borderColor: colours[group] }}
          >
            <div className="condition_name" style={{ color: colours[group] }}>
              If <strong>{name}</strong>:
            </div>
            {children}
          </div>
        );
      default:
        return;
    }
  };

  onKeyDown = (event, change) => {
    if (event.key === "Enter" && !event.shiftKey) {
      const { value } = change;
      const { startBlock } = value;
      if (startBlock.type !== "list-item")
        return change.insertBlock("paragraph");
    }

    let mark;
    if (isBoldHotkey(event)) {
      mark = "bold";
    } else if (isItalicHotkey(event)) {
      mark = "italic";
    } else if (isUnderlinedHotkey(event)) {
      mark = "underlined";
    } else if (isCodeHotkey(event)) {
      mark = "code";
    } else {
      return;
    }

    event.preventDefault();
    change.toggleMark(mark);
    return true;
  };

  handleConditionGroupMenuClick = (e, conditionGroup, index) => {
    const { action, updateAction } = this.props;
    const { visible } = this.state;

    switch (e.key) {
      case "edit":
        this.setState({ visible: { ...visible, conditionGroup: true } });
        this.boundActionCreators.openConditionGroupModal(conditionGroup);
        break;
      case "delete":
        this.boundActionCreators.deleteConditionGroup({
          actionId: action.id,
          index,
          onSuccess: action => updateAction(action)
        });
        break;
      default:
        break;
    }
  };

  isInsideContent(mouseEvent) {
    const contentEditor = this.editor.getBoundingClientRect();
    const isInsideX =
      mouseEvent.clientX >= contentEditor.x &&
      mouseEvent.clientX <= contentEditor.x + contentEditor.width;
    const isInsideY =
      mouseEvent.clientY >= contentEditor.y &&
      mouseEvent.clientY <= contentEditor.y + contentEditor.height;

    // isInside flag is consumed by:
    //   The conditional css class on the content editor (darkens the border)
    //   Determining whether to add the dragged condition group to the content editor after drag stops
    this.setState({ isInside: isInsideX && isInsideY });
  }

  stopDrag(conditionGroup, index) {
    const { isInside, value } = this.state;
    if (!isInside) return;

    const change = value.change();
    conditionGroup.conditions.reverse().forEach(condition => {
      change.insertBlock({
        type: "condition",
        data: {
          name: condition.name,
          group: index
        }
      });
    });

    this.setState({ isInside: false });
    this.onChange(change);
  }

  handleContent = fn => {
    const { action, updateAction } = this.props;
    const { preview, value } = this.state;

    const payload = {
      blockMap: value.toJSON(),
      html: this.generateHtml()
    };

    if (fn === "preview") {
      this.setState({ preview: { ...preview, loading: true } });
      ActionActionCreators.previewContent({
        actionId: action.id,
        payload,
        onError: error =>
          this.setState({ preview: { ...preview, loading: false }, error }),
        onSuccess: response => {
          const { populatedContent } = response;
          this.setState({
            preview: {
              ...preview,
              visible: true,
              loading: false,
              populatedContent
            },
            error: null
          });
        }
      });
    } else if (fn === "submit") {
      this.setState({ contentLoading: true });
      this.boundActionCreators.updateContent({
        actionId: action.id,
        payload,
        onError: error => this.setState({ contentLoading: false, error }),
        onSuccess: action => {
          this.setState({ contentLoading: false, error: null });
          updateAction(action);
        }
      });
    }
  };

  onChange = ({ value }) => {
    this.setState({ value });
  };

  generateHtml = () => {
    const { value } = this.state;

    const rules = [
      {
        serialize(obj, children) {
          if (["block", "inline"].includes(obj.object)) {
            switch (obj.type) {
              case "heading-one":
                return <h1>{children}</h1>;
              case "heading-two":
                return <h2>{children}</h2>;
              case "paragraph":
                return <p className={obj.data.get("className")}>{children}</p>;
              case "numbered-list":
                return <ol>{children}</ol>;
              case "bulleted-list":
                return <ul>{children}</ul>;
              case "list-item":
                return <li>{children}</li>;
              case "link":
                return (
                  <a href={obj.data.get("href")} target="_blank">
                    {children}
                  </a>
                );
              case "image":
                return (
                  <img
                    src={obj.data.get("src")}
                    alt={obj.data.get("alt")}
                    style={{ maxWidth: "100%" }}
                  />
                );
              case "condition":
                return <div>{children}</div>;
              default:
                return;
            }
          }
        }
      },
      {
        serialize(obj, children) {
          if (obj.object === "mark") {
            switch (obj.type) {
              case "bold":
                return <strong>{children}</strong>;
              case "italic":
                return <em>{children}</em>;
              case "underlined":
                return <u>{children}</u>;
              case "code":
                return (
                  <pre>
                    <code>{children}</code>
                  </pre>
                );
              default:
                return;
            }
          }
        }
      }
    ];

    const html = new Html({ rules });
    const output = value.document.nodes.map(node => {
      const pseudoValue = { document: { nodes: [node] } };
      return html.serialize(pseudoValue);
    });

    return [...output];
  };

  LinkButton = () => {
    const { hyperlink, value } = this.state;
    const change = value.change();

    return (
      <Popconfirm
        icon={null}
        title={
          <div className="action_toolbar_popup">
            <Input
              placeholder="Label"
              size="small"
              onChange={e =>
                this.setState({
                  hyperlink: { ...hyperlink, label: e.target.value }
                })
              }
              value={hyperlink.label}
            />
            <Input
              placeholder="URL"
              size="small"
              onChange={e =>
                this.setState({
                  hyperlink: { ...hyperlink, url: e.target.value }
                })
              }
              value={hyperlink.url}
            />
          </div>
        }
        onVisibleChange={visible => {
          if (!visible)
            this.setState({ hyperlink: { label: null, url: null } });
        }}
        onConfirm={() => {
          change.insertInline({
            type: "link",
            data: { href: hyperlink.url },
            nodes: [
              {
                object: "text",
                leaves: [
                  {
                    text: hyperlink.label ? hyperlink.label : hyperlink.url
                  }
                ]
              }
            ]
          });
          this.onChange(change);
        }}
      >
        <i className="material-icons">insert_link</i>
      </Popconfirm>
    );
  };

  ImageButton = () => {
    const { image, value } = this.state;
    const change = value.change();

    return (
      <Popconfirm
        icon={null}
        title={
          <div className="action_toolbar_popup">
            <Input
              placeholder="Image URL"
              size="small"
              onChange={e =>
                this.setState({
                  image: { ...image, src: e.target.value }
                })
              }
              value={image.src}
            />
            <Input
              placeholder="Description/Alt tag"
              size="small"
              onChange={e =>
                this.setState({
                  image: { ...image, alt: e.target.value }
                })
              }
              value={image.alt}
            />
          </div>
        }
        onVisibleChange={visible => {
          if (!visible) this.setState({ image: { src: null, alt: null } });
        }}
        onConfirm={() => {
          change.insertInline({
            type: "image",
            data: { src: image.src, alt: image.alt },
            isVoid: true
          });
          this.onChange(change);
        }}
      >
        <i className="material-icons">insert_photo</i>
      </Popconfirm>
    );
  };

  onPaste = (event, change) => {
    const transfer = getEventTransfer(event);
    console.log(transfer);
    // const { document } = serializer.deserialize(transfer.text)
    // change.insertFragment(document)
    // return true
  };

  render() {
    const { action, updateAction } = this.props;
    const {
      preview,
      visible,
      contentLoading,
      error,
      value,
      colours,
      isInside
    } = this.state;

    return (
      <div>
        <h3>
          Filter
          <Button
            style={{ marginLeft: "10px" }}
            shape="circle"
            icon="edit"
            onClick={() => {
              this.boundActionCreators.openFilterModal(action.filter);
              this.setState({ visible: { ...visible, filter: true } });
            }}
          />
        </h3>

        {_.get(action, "filter.formulas", []).length > 0
          ? `${action.filtered_data_length} records selected out of ${
              action.unfiltered_data_length
            } (${action.unfiltered_data_length -
              action.filtered_data_length} filtered out)`
          : "No filter is currently being applied"}

        {action.datalab.data.length > 0 && (
          <div className="filter_results">
            <Table
              size="small"
              scroll={{ x: true }}
              pagination={{
                pageSize: 5
              }}
              dataSource={action.datalab.data.map((item, i) => ({
                ...item,
                key: i
              }))}
              columns={Object.keys(action.datalab.data[0]).map(field => ({
                title: field,
                dataIndex: field,
                key: field
              }))}
            />
          </div>
        )}

        <FilterModal
          action={action}
          updateAction={updateAction}
          visible={visible.filter}
          closeModal={() => {
            this.boundActionCreators.closeFilterModal();
            this.setState({ visible: { ...visible, filter: false } });
          }}
        />

        <Divider dashed />

        <h3>
          Condition groups
          <Button
            style={{ marginLeft: "10px" }}
            shape="circle"
            icon="plus"
            onClick={() => {
              this.boundActionCreators.openConditionGroupModal();
              this.setState({ visible: { ...visible, conditionGroup: true } });
            }}
          />
        </h3>

        <ConditionGroupModal
          action={action}
          updateAction={updateAction}
          visible={visible.conditionGroup}
          closeModal={() => {
            this.boundActionCreators.closeConditionGroupModal();
            this.setState({ visible: { ...visible, conditionGroup: false } });
          }}
        />

        {action && action.conditionGroups && action.conditionGroups.length > 0
          ? action.conditionGroups.map((conditionGroup, i) => {
              return (
                <Draggable
                  key={i}
                  position={{ x: 0, y: 0 }}
                  onDrag={e => this.isInsideContent(e)}
                  onStop={() => this.stopDrag(conditionGroup, i)}
                >
                  <Dropdown.Button
                    overlay={
                      <Menu
                        onClick={e =>
                          this.handleConditionGroupMenuClick(
                            e,
                            conditionGroup,
                            i
                          )
                        }
                      >
                        <Menu.Item key="edit">Edit</Menu.Item>
                        <Menu.Item key="delete">Delete</Menu.Item>
                      </Menu>
                    }
                    className="conditionGroupBtn"
                    key={i}
                    trigger={["click"]}
                    style={{
                      marginRight: "5px",
                      zIndex: 10
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        background: colours[i],
                        marginRight: 5,
                        display: "inline-block"
                      }}
                    />
                    {conditionGroup.name}
                  </Dropdown.Button>
                </Draggable>
              );
            })
          : "No condition groups have been added yet."}

        <Divider dashed />

        <h3>Content</h3>

        <div className="toolbar">
          {this.renderMarkButton("bold", "format_bold")}
          {this.renderMarkButton("italic", "format_italic")}
          {this.renderMarkButton("underlined", "format_underlined")}
          {this.renderMarkButton("code", "code")}
          {this.LinkButton()}
          {this.ImageButton()}
          {this.renderBlockButton("heading-one", "looks_one")}
          {this.renderBlockButton("heading-two", "looks_two")}
          {this.renderBlockButton("paragraph", "short_text")}
          {this.renderBlockButton("numbered-list", "format_list_numbered")}
          {this.renderBlockButton("bulleted-list", "format_list_bulleted")}
        </div>
        <Editor
          className={`content_editor ${isInside ? "isInside" : ""}`}
          value={value}
          onChange={this.onChange}
          onKeyDown={this.onKeyDown}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          renderEditor={props => (
            <div ref={editor => (this.editor = editor)}>{props.children}</div>
          )}
          plugins={plugins}
          placeholder={"Create content by entering text here"}
          onPaste={this.onPaste}
        />

        <PreviewModal
          data={action.datalab.data}
          preview={preview}
          onClose={() =>
            this.setState({
              preview: {
                loading: false,
                visible: false,
                populatedContent: []
              }
            })
          }
        />

        <div style={{ marginTop: "10px" }}>
          <Button
            loading={preview.loading}
            style={{ marginRight: "10px" }}
            size="large"
            onClick={() => {
              this.handleContent("preview");
            }}
          >
            Preview
          </Button>
          <Button
            loading={contentLoading}
            type="primary"
            size="large"
            onClick={() => {
              this.handleContent("submit");
            }}
          >
            Save
          </Button>
        </div>

        {/* <Button
          onClick={() => {
            console.log(value.toJSON());
            console.log(this.generateHtml());
          }}
        >
          Test
        </Button> */}

        {error && (
          <Alert message={error} type="error" style={{ marginTop: "10px" }} />
        )}
      </div>
    );
  }
}

export default connect()(Compose);
