import React, { PropTypes, Component } from 'react';
import styles from './Checkbox.scss';
import withStyles from '../../../decorators/withStyles';

@withStyles(styles) class Checkbox extends Component {
    constructor(props) {
        super(props);
    }

    checkboxChange(event) {
        var { onChange } = this.props;
        if (onChange) {
            onChange(event.target.checked)
        }
    }

    render() {
        var { text, children, align, readOnly } = this.props;

        var classValue = 'ui-checkbox';
        if (align == 'top') {
            classValue += ' ui-checkbox_align-top';
        }

        return (
            <label className={classValue}>
                <input readOnly={readOnly} className="ui-checkbox__input" name="roaming" type="checkbox"
                       onChange={this.checkboxChange.bind(this)}
                       checked={this.props.checked}
                    />
                <span className="ui-checkbox__checkbox icon-emb-ok"></span>
                {
                    text ?
                        <span className="ui-checkbox__label">{text}</span>
                        :
                        <span className="ui-checkbox__label">{children}</span>
                }
            </label>
        );
    }

}

export default Checkbox;
