/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
/* eslint-enable */
import { polyfill } from 'react-lifecycles-compat';
import Form from './Form';
import { debounce } from './utils';

class Input extends React.Component {

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.validators && nextProps.errorMessages &&
            (
                prevState.validators !== nextProps.validators ||
                prevState.errorMessages !== nextProps.errorMessages
            )
        ) {
            return {
                value: nextProps.value,
                validators: nextProps.validators,
                errorMessages: nextProps.errorMessages,
            };
        }

        return {
            value: nextProps.value,
        };
    }

    state = {
        isValid: true,
        value: this.props.value,
        errorMessages: this.props.errorMessages,
        validators: this.props.validators,
    }

    componentDidMount() {
        this.configure();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.state !== nextState || this.props !== nextProps;
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.instantValidate && this.props.value !== prevState.value) {
            this.validateDebounced(this.props.value, this.props.withRequiredValidator);
        }
    }

    componentWillUnmount() {
        this.context.form.detachFromForm(this);
        this.validateDebounced.cancel();
    }

    getErrorMessage = () => {
        const { errorMessages } = this.state;
        const type = typeof errorMessages;

        if (type === 'string') {
            return errorMessages;
        } else if (type === 'object') {
            if (this.invalid.length > 0) {
                return errorMessages[this.invalid[0]];
            }
        }
        // eslint-disable-next-line
        console.log('unknown errorMessages type', errorMessages);
        return true;
    }

    instantValidate = true
    invalid = []

    configure = () => {
        this.context.form.attachToForm(this);
        this.instantValidate = this.context.form.instantValidate;
        this.debounceTime = this.context.form.debounceTime;
        this.validateDebounced = debounce(this.validate, this.debounceTime);
    }

    validate = (value, includeRequired = false, dryRun = false) => {
        const validations = Promise.all(
            this.state.validators.map(validator => Form.getValidator(validator, value, includeRequired)),
        );

        validations.then((results) => {
            this.invalid = [];
            let valid = true;
            results.forEach((result, key) => {
                if (!result) {
                    valid = false;
                    this.invalid.push(key);
                }
            });
            if (!dryRun) {
                this.setState({ isValid: valid }, () => {
                    this.props.validatorListener(this.state.isValid);
                });
            }
        });
    }

    isValid = () => this.state.isValid;

    makeInvalid = () => {
        this.setState({ isValid: false });
    }

    makeValid = () => {
        this.setState({ isValid: true });
    }
}

Input.contextTypes = {
    form: PropTypes.object,
};

Input.propTypes = {
    errorStyle: PropTypes.shape({
        container: PropTypes.shape({
            top: PropTypes.number,
            left: PropTypes.number,
            position: PropTypes.string,
        }),
        text: PropTypes.shape({}),
        underlineValidColor: PropTypes.string,
        underlineInvalidColor: PropTypes.string,
    }),
    errorMessages: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.string,
    ]),
    validators: PropTypes.array,
    value: PropTypes.any,
    validatorListener: PropTypes.func,
    withRequiredValidator: PropTypes.bool,
};

Input.defaultProps = {
    errorStyle: {
        container: {
            top: 0,
            left: 0,
            position: 'absolute',
        },
        text: {
            color: 'red',
        },
        underlineValidColor: 'gray',
        underlineInvalidColor: 'red',
    },
    errorMessages: 'error',
    validators: [],
    validatorListener: () => {},
};

polyfill(Input);

export default Input;
