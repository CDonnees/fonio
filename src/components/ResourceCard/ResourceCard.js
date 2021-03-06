/* eslint react/no-find-dom-node: 0 */
/**
 * This module provides a reusable resource card component
 * @module fonio/components/ResourceCard
 */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {DragSource, DropTarget} from 'react-dnd';
import {findDOMNode} from 'react-dom';

import {translateNameSpacer} from '../../helpers/translateUtils';

import './ResourceCard.scss';


/**
 * react-dnd drag & drop handlers
 */


/**
 * drag source handler
 */
const sectionSource = {
  beginDrag(props) {
    return {
      id: props.sectionKey,
      index: props.sectionIndex
    };
  }
};


/**
 * drag target handler
 */
const sectionTarget = {

  /**
   * Drag on hover behavior
   * Initial design & implementation @yomguithereal
   * (https://github.com/medialab/quinoa/blob/master/src/components/draggable.js)
   */
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index,
          hoverIndex = props.sectionIndex;
    // If itself, we break
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    props.onMove(dragIndex, hoverIndex);
    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  }
};


/**
 * dnd-related decorators for the ResourceCard component
 */
@DragSource('SECTION', sectionSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging()
}))
@DropTarget('SECTION', sectionTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver()
}))

/**
 * ResourceCard class for building react component instances
 */
class ResourceCard extends Component {

  /**
   * Component's context used properties
   */
  static contextTypes = {

    /**
     * Un-namespaced translate function
     */
    t: PropTypes.func.isRequired
  }


  /**
   * constructor
   * @param {object} props - properties given to instance at instanciation
   */
  constructor(props) {
    super(props);
  }


  /**
   * Renders the component
   * @return {ReactElement} component - the component
   */
  render() {
    const {
      props,
      context
    } = this;
    const {
      data,
      metadata,
      onDelete,
      onConfigure,
      selectMode,
      onSelect,

      connectDragSource,
      connectDragPreview,
      connectDropTarget,

      onMouseDown,
    } = props;
    // namespacing the translate function
    const translate = translateNameSpacer(context.t, 'Components.ResourceCard');


    /**
     * component's callbacks
     */
    const onDeleteClick = e => {
      e.stopPropagation();
      onDelete();
    };

    const onConfigureClick = e => {
      e.stopPropagation();
      onConfigure();
    };

    const onMDown = () => {
      if (typeof onMouseDown === 'function') {
        onMouseDown();
      }
    };

    const onGlobalClick = () => {
      // in select mode clicking on the element means choosing it
      if (selectMode) {
        onSelect(metadata);
      }
      // else open resource configuration view
      else {
        onConfigure();
      }
    };

    const startDrag = (e) => {
      if (selectMode) {
        return e.preventDefault();
      }
       e.dataTransfer.dropEffect = 'move';
       e.dataTransfer.setData('text', 'DRAFTJS_RESOURCE_ID:' + metadata.id);
     };

    let resourceName;
    // todo: clean the following hack
    // for now we use the data instead of metadata
    // for citations and glossary mentions because it is more
    // meaningfull.
    // These types of resources should be given a proper title in their
    // metadata field in other parts of the code (resource creation/update)
    if (metadata.type === 'bib') {
      resourceName = data[0] && data[0].title && data[0].title.length ? data[0].title : translate('untitled-asset');
    }
    else if (metadata.type === 'glossary') {
      resourceName = data.name && data.name.length ? data.name : translate('untitled-asset');
    }
    else {
      resourceName = metadata.title && metadata.title.length ? metadata.title : translate('untitled-asset');
    }
    return connectDragPreview(connectDragSource(connectDropTarget(
      <li
        draggable
        onDragStart={startDrag}
        onMouseDown={onMDown}
        className={'fonio-ResourceCard' + (selectMode ? ' select-mode' : '')}
        onClick={onGlobalClick}>
        <div
          className="card-header">
          <img src={require('../../sharedAssets/' + metadata.type + '-black.svg')} />
          <h5>
            <span className="title">{resourceName}</span>
          </h5>
        </div>
        {
          // for now we choose to not display resource description in the cards
          /*<div
            className="card-body">
            <div className="info-column">
              <p className="description">
                {metadata.description && metadata.description.length ? metadata.description : translate('no-description')}
              </p>
            </div>
            <div className="buttons-column" />
          </div>*/
        }
        <div className="card-footer">
          <button className="settings-btn" onClick={onConfigureClick}>
            <img src={require('../../sharedAssets/settings-black.svg')} className="fonio-icon-image" />
            {translate('settings')}
          </button>
          <button className={'delete-btn '} onClick={onDeleteClick}>
            <img src={require('../../sharedAssets/close-black.svg')} className="fonio-icon-image" />
            {translate('delete')}
          </button>
        </div>
      </li>
    )));
  }
}

/**
 * Component's properties types
 */
ResourceCard.propTypes = {

  /**
   * data of the card
   */
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),

  /**
   * metadata of the card
   */
  metadata: PropTypes.object,

  /**
   * Callbacks when the card is asked to be deleted
   */
  onDelete: PropTypes.func,

  /**
   * Callbacks when the card is asking to be configured
   */
  onConfigure: PropTypes.func,

  /**
   * Whether the card is in select mode
   */
  selectMode: PropTypes.bool,

  /**
   * Callbacks when the card is selected
   */
  onSelect: PropTypes.func,

  /**
   * Map of actions to execute when the card is started dragged
   */
  connectDragSource: PropTypes.object,

  /**
   * Map of actions to execute when the card has to be previewed
   */
  connectDragPreview: PropTypes.object,

  /**
   * Map of actions to execute when the card is dropped
   */
  connectDropTarget: PropTypes.object,

  /**
   * Callbacks when the card is pressed
   */
  onMouseDown: PropTypes.func,
};

export default ResourceCard;
