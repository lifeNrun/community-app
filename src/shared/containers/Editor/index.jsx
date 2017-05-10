/* global confirm localStorage */

import React, { Component } from 'react';
import _ from 'lodash';
import uuid from 'uuid/v4';
import $ from 'jquery';
import {
  convertFromHTML, // eslint-disable-line no-unused-vars
  convertToRaw, // eslint-disable-line no-unused-vars
  ContentState, // eslint-disable-line no-unused-vars
  EditorState, // eslint-disable-line no-unused-vars
} from 'draft-js';
import draftToHtml from 'draftjs-to-html'; // eslint-disable-line no-unused-vars
import draftToMarkdown from 'draftjs-to-markdown'; // eslint-disable-line no-unused-vars
import logger from 'utils/logger';

// These will be changed / used when custom Editor will be added as a npm package / submodule
import { Editor } from 'react-draft-wysiwyg/dist/react-draft-wysiwyg';
import editorStyles from 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'; // eslint-disable-line no-unused-vars

import styles from './styles.css'; // eslint-disable-line no-unused-vars

class Playground extends Component {
  constructor(props) {
    super(props);

    this.state = {
      rows: [],
      editorData: {},
      nextTabIndex: 1,
      bgImg: '',
    };
  }

  onEditorStateChange(editorId, editorState) {
    const editorData = this.state.editorData;
    editorData[editorId].editorState = editorState;
    this.setState({
      editorData,
    });
  }

  onContentChange(editorId, editorContent) {
    const editorData = this.state.editorData;
    editorData[editorId].editorContent = editorContent;
    this.setState({
      editorData,
    });
  }

  onBlur(editorId) {
    _.noop(editorId);
    _.noop(this);
  }

  setBackgroundImage(editorId, img) {
    const editorData = this.state.editorData;
    editorData[editorId].bgImg = img;

    const self = this;
    setTimeout(() => {
      self.setState({
        editorData,
      });
    }, 100);
  }

  setBackgroundSpannedImage(rowIndex, img) {
    const rows = this.state.rows;
    rows[rowIndex].bgSpan = img;

    const self = this;
    setTimeout(() => {
      self.setState({
        rows,
      });
    }, 100);
  }

  imageUploadCallBack(file) {
    _.noop(this);
    return new Promise(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest(); // eslint-disable-line no-undef
        xhr.open('POST', 'https://api.imgur.com/3/image');
        xhr.setRequestHeader('Authorization', 'Client-ID 8d26ccd12712fca');
        const data = new FormData(); // eslint-disable-line no-undef
        data.append('image', file);
        xhr.send(data);
        xhr.addEventListener('load', () => {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        });
        xhr.addEventListener('error', () => {
          const error = JSON.parse(xhr.responseText);
          reject(error);
        });
      },
    );
  }

  insertSection(sectionType) {
    const rowId = uuid();
    const rowData = {
      id: rowId,
      type: sectionType,
      ids: [],
    };

    switch (sectionType) {
      case '1C':
        rowData.ids = [`${rowId}-0`];
        break;
      case '1:2':
        rowData.ids = [`${rowId}-0`, `${rowId}-1`];
        break;
      case '2:1':
        rowData.ids = [`${rowId}-0`, `${rowId}-1`];
        break;
      case '3C':
        rowData.ids = [`${rowId}-0`, `${rowId}-1`, `${rowId}-2`];
        break;
      default:
    }

    const newEditorData = {};
    _.each(rowData.ids, (editorId) => {
      newEditorData[editorId] = {
        editorState: undefined,
        editorContent: undefined,
      };
    });

    const rows = this.state.rows.concat(rowData);
    const editorData = _.assign({}, this.state.editorData, newEditorData);
    const nextTabIndex = this.state.nextTabIndex + 3;

    this.setState({
      nextTabIndex, rows, editorData,
    });
  }

  deleteSection(rowDetailsId) {
    if (confirm('Remove this section?')) { // eslint-disable-line no-alert
      const oldRows = _.map(this.state.rows, _.clone);
      const oldEditorData = _.assign({}, this.state.editorData);

      let ids = [];
      _.each(oldRows, (row) => {
        if (row.id === rowDetailsId) {
          ids = row.ids;
        }
      });

      const rows = _.reject(oldRows, row => row.id === rowDetailsId);
      const editorData = _.omit(oldEditorData, ids);

      this.setState({
        rows, editorData,
      });
    }
  }

  save() {
    localStorage.setItem('rows', JSON.stringify(this.state.rows));
    localStorage.setItem('editorData', JSON.stringify(this.state.editorData));
  }

  load() {
    try {
      const rows = JSON.parse(localStorage.getItem('rows'));
      const editorData = JSON.parse(localStorage.getItem('editorData'));
      this.setState({
        rows, editorData,
      });
    } catch (e) {
      logger.log(e);
    }
  }

  imageAlignHelper() {
    const self = this;
    const rows = this.state.rows;
    const editorData = this.state.editorData;

    try {
      _.each(rows, (row) => {
        _.each(row.ids, (id) => {
          const alignment = editorData[id].imgFloat || 'none';
          self.imageAlign(id, alignment);
        });
      });
    } catch (e) {
      logger.log(e);
    }
  }

  imageAlign(editorId, alignment) {
    const figure = $(`.editor-${editorId}`).find('figure');
    figure.addClass(`float-${alignment}`);

    const editorData = this.state.editorData;
    editorData[editorId].imgFloat = alignment;
    const self = this;
    setTimeout(() => {
      self.setState({
        editorData,
      });
    }, 100);
  }

  loadThemr() {
    this.setState({
      themr: {
        color: 'white',
        background: 'red',
      },
    });
  }

  render() {
    return (
      <div className="playground-root">
        <h3>Community Page Editor</h3>
        <div className="custom-toolbox-wrap">
          <button
            className="option-wrapper"
            onClick={() => this.insertSection('1C')}
          >1C</button>
          <button
            className="option-wrapper"
            onClick={() => this.insertSection('1:2')}
          >1:2</button>
          <button
            className="option-wrapper"
            onClick={() => this.insertSection('2:1')}
          >2:1</button>
          <button
            className="option-wrapper"
            onClick={() => this.insertSection('3C')}
          >3C</button>
          <button
            className="option-wrapper"
            onClick={() => this.save()}
          >Save</button>
          <button
            className="option-wrapper"
            onClick={() => this.load()}
          >Load</button>
          <button
            className="option-wrapper"
            onClick={() => this.loadThemr()}
          >Load Themr</button>
        </div>
        <br />
        <div className="custom-editor-wrap">

          {this.state.rows.map((rowDetails, rowIndex) => <div
            key={rowDetails.id}
            className="playground-editorSection"
            style={{
              backgroundImage: `url(${this.state.rows[rowIndex].bgSpan || ''})`,
              backgroundSize: 'cover',
            }}
          >
            <button
              className="custom-button delete-button"
              onClick={() => this.deleteSection(rowDetails.id)}
            >X</button>

            {rowDetails.ids.map((editorId, columnIndex) => {
              if (rowDetails.type) {
                let className = '';
                if (rowDetails.type === '1:2' && columnIndex === 0) {
                  className = 'width-33';
                } else if (rowDetails.type === '1:2' && columnIndex === 1) {
                  className = 'width-66';
                } else if (rowDetails.type === '2:1' && columnIndex === 0) {
                  className = 'width-66';
                } else if (rowDetails.type === '2:1' && columnIndex === 1) {
                  className = 'width-33';
                } else if (rowDetails.type === '3C') {
                  className = 'width-33';
                }

                return (<div
                  key={editorId}
                  className={`${className} editor-${editorId} playground-editorWrapper`}
                  style={{
                    backgroundImage: `url(${this.state.editorData[editorId].bgImg || ''})`,
                    backgroundSize: 'cover',
                  }}
                >
                  <Editor
                    toolbarOnFocus
                    spellCheck
                    tabIndex={this.state.nextTabIndex}
                      // editorState={this.state.editorData[editorId].editorState}
                    initialContentState={this.state.editorData[editorId].editorContent}
                    toolbarClassName="playground-toolbar"
                    wrapperClassName="playground-wrapper"
                    editorClassName="playground-editor"
                    toolbar={{
                      history: { inDropdown: true },
                      inline: { inDropdown: true },
                      list: { inDropdown: true },
                      link: { showOpenOptionOnHover: true },
                      textAlign: { inDropdown: true },
                      image: { uploadCallback: this.imageUploadCallBack },
                    }}
                    onEditorStateChange={
                      state => this.onEditorStateChange(editorId, state)
                    }
                    onContentStateChange={
                      content => this.onContentChange(editorId, content)
                    }
                    onBlur={() => this.onBlur(editorId)}
                    onBGImage={img => this.setBackgroundImage(editorId, img)}
                    onBGSpan={img => this.setBackgroundSpannedImage(rowIndex, img)}
                    imageAlign={al => this.imageAlign(editorId, al)}
                    themr={this.state.themr}
                  />
                </div>);
              }
              return undefined;
            })}

          </div>)}

        </div>
      </div>
    );
  }
}

export default Playground;