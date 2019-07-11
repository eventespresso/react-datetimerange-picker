import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { polyfill } from 'react-lifecycles-compat';
import makeEventProps from 'make-event-props';
import mergeClassNames from 'merge-class-names';
import Fit from 'react-fit';

import Calendar from 'react-calendar/dist/entry.nostyle';
import Clock from 'react-clock/dist/entry.nostyle';
import DateTimeInput from 'react-datetime-picker/dist/DateTimeInput';

import { isMaxDate, isMinDate } from './shared/propTypes';
import { callIfDefined } from './shared/utils';

const allViews = ['hour', 'minute', 'second'];
const baseClassName = 'react-datetimerange-picker';
const outsideActionEvents = ['mousedown', 'focusin', 'touchstart'];

export default class DateTimeRangePicker extends PureComponent {
  static getDerivedStateFromProps(nextProps, prevState) {
    const nextState = {};

    if (nextProps.isCalendarOpen !== prevState.isCalendarOpenProps) {
      nextState.isCalendarOpen = nextProps.isCalendarOpen;
      nextState.isCalendarOpenProps = nextProps.isCalendarOpen;
    }

    if (nextProps.isClockOpen !== prevState.isClockOpenProps) {
      nextState.isClockOpen = nextProps.isClockOpen;
      nextState.isClockOpenProps = nextProps.isClockOpen;
    }

    return nextState;
  }

  state = {};

  get eventProps() {
    return makeEventProps(this.props);
  }

  componentDidMount() {
    this.handleOutsideActionListeners();
  }

  componentDidUpdate(prevProps, prevState) {
    const { isCalendarOpen, isClockOpen } = this.state;
    const {
      onCalendarClose,
      onCalendarOpen,
      onClockClose,
      onClockOpen,
    } = this.props;

    const isWidgetOpen = isCalendarOpen || isClockOpen;
    const prevIsWidgetOpen = prevState.isCalendarOpen || prevState.isClockOpen;

    if (isWidgetOpen !== prevIsWidgetOpen) {
      this.handleOutsideActionListeners();
    }

    if (isCalendarOpen !== prevState.isCalendarOpen) {
      callIfDefined(isCalendarOpen ? onCalendarOpen : onCalendarClose);
    }

    if (isClockOpen !== prevState.isClockOpen) {
      callIfDefined(isClockOpen ? onClockOpen : onClockClose);
    }
  }

  componentWillUnmount() {
    this.handleOutsideActionListeners(false);
  }

  handleOutsideActionListeners(shouldListen) {
    const { isCalendarOpen, isClockOpen } = this.state;
    const isWidgetOpen = isCalendarOpen || isClockOpen;

    const shouldListenWithFallback = typeof shouldListen !== 'undefined' ? shouldListen : isWidgetOpen;
    const fnName = shouldListenWithFallback ? 'addEventListener' : 'removeEventListener';
    outsideActionEvents.forEach(eventName => document[fnName](eventName, this.onOutsideAction));
  }

  onOutsideAction = (event) => {
    if (this.wrapper && !this.wrapper.contains(event.target)) {
      this.closeWidgets();
    }
  }

  onDateChange = ([valueFrom, valueTo], closeWidgets = true) => {
    const { value } = this.props;
    const [prevValueFrom, prevValueTo] = [].concat(value);

    const nextValueFrom = (() => {
      if (!prevValueFrom) {
        return valueFrom;
      }

      const valueWithHour = new Date(valueFrom);
      valueWithHour.setHours(
        prevValueFrom.getHours(),
        prevValueFrom.getMinutes(),
        prevValueFrom.getSeconds(),
        prevValueFrom.getMilliseconds(),
      );

      return valueWithHour;
    })();

    const nextValueTo = (() => {
      if (!prevValueTo) {
        return valueTo;
      }

      const valueWithHour = new Date(valueTo);
      valueWithHour.setHours(
        prevValueTo.getHours(),
        prevValueTo.getMinutes(),
        prevValueTo.getSeconds(),
        prevValueTo.getMilliseconds(),
      );

      return valueWithHour;
    })();

    this.onChange([nextValueFrom, nextValueTo], closeWidgets);
  }

  onChange = (value, closeWidgets = true) => {
    this.setState(prevState => ({
      isCalendarOpen: prevState.isCalendarOpen && !closeWidgets,
      isClockOpen: prevState.isClockOpen && !closeWidgets,
    }));

    const { onChange } = this.props;
    if (onChange) {
      onChange(value);
    }
  }

  onChangeFrom = (valueFrom, closeWidgets = true) => {
    const { value } = this.props;
    const [, valueTo] = [].concat(value);
    this.onChange([valueFrom, valueTo], closeWidgets);
  }

  onChangeTo = (valueTo, closeWidgets = true) => {
    const { value } = this.props;
    const [valueFrom] = [].concat(value);
    this.onChange([valueFrom, valueTo], closeWidgets);
  }

  onFocus = (event) => {
    const { disabled, onFocus } = this.props;

    if (onFocus) {
      onFocus(event);
    }

    // Internet Explorer still fires onFocus on disabled elements
    if (disabled) {
      return;
    }

    switch (event.target.name) {
      case 'day':
      case 'month':
      case 'year':
        this.openCalendar();
        break;
      case 'hour12':
      case 'hour24':
      case 'minute':
      case 'second':
        this.openClock();
        break;
      default:
    }
  }

  openClock = () => {
    this.setState({
      isCalendarOpen: false,
      isClockOpen: true,
    });
  }

  openCalendar = () => {
    this.setState({
      isCalendarOpen: true,
      isClockOpen: false,
    });
  }

  toggleCalendar = () => {
    this.setState(prevState => ({
      isCalendarOpen: !prevState.isCalendarOpen,
      isClockOpen: false,
    }));
  }

  closeWidgets = () => {
    this.setState((prevState) => {
      if (!prevState.isCalendarOpen && !prevState.isClockOpen) {
        return null;
      }

      return {
        isCalendarOpen: false,
        isClockOpen: false,
      };
    });
  }

  stopPropagation = event => event.stopPropagation();

  clear = () => this.onChange(null);

  renderInputs() {
    const {
      amPmAriaLabel,
      calendarAriaLabel,
      calendarIcon,
      clearAriaLabel,
      clearIcon,
      dayAriaLabel,
      disabled,
      format,
      hourAriaLabel,
      locale,
      maxDate,
      maxDetail,
      minDate,
      minuteAriaLabel,
      monthAriaLabel,
      name,
      nativeInputAriaLabel,
      required,
      secondAriaLabel,
      showLeadingZeros,
      value,
      yearAriaLabel,
    } = this.props;

    const { isCalendarOpen, isClockOpen } = this.state;

    const [valueFrom, valueTo] = [].concat(value);

    const ariaLabelProps = {
      amPmAriaLabel,
      dayAriaLabel,
      hourAriaLabel,
      minuteAriaLabel,
      monthAriaLabel,
      nativeInputAriaLabel,
      secondAriaLabel,
      yearAriaLabel,
    };

    const commonProps = {
      ...ariaLabelProps,
      className: `${baseClassName}__inputGroup`,
      disabled,
      format,
      isWidgetOpen: isCalendarOpen || isClockOpen,
      locale,
      maxDate,
      maxDetail,
      minDate,
      required,
      showLeadingZeros,
    };

    return (
      <div className={`${baseClassName}__wrapper`}>
        <DateTimeInput
          {...commonProps}
          name={`${name}_from`}
          onChange={this.onChangeFrom}
          returnValue="start"
          value={valueFrom}
        />
        <span className={`${baseClassName}__range-divider`}>
          –
        </span>
        <DateTimeInput
          {...commonProps}
          name={`${name}_to`}
          onChange={this.onChangeTo}
          returnValue="end"
          value={valueTo}
        />
        {clearIcon !== null && (
          <button
            aria-label={clearAriaLabel}
            className={`${baseClassName}__clear-button ${baseClassName}__button`}
            disabled={disabled}
            onClick={this.clear}
            onFocus={this.stopPropagation}
            type="button"
          >
            {clearIcon}
          </button>
        )}
        {calendarIcon !== null && (
          <button
            aria-label={calendarAriaLabel}
            className={`${baseClassName}__calendar-button ${baseClassName}__button`}
            disabled={disabled}
            onClick={this.toggleCalendar}
            onFocus={this.stopPropagation}
            onBlur={this.resetValue}
            type="button"
          >
            {calendarIcon}
          </button>
        )}
      </div>
    );
  }

  renderCalendar() {
    const { isCalendarOpen } = this.state;

    if (isCalendarOpen === null) {
      return null;
    }

    const {
      calendarClassName,
      className: dateTimeRangePickerClassName, // Unused, here to exclude it from calendarProps
      maxDetail: dateTimeRangePickerMaxDetail, // Unused, here to exclude it from calendarProps
      onChange,
      value,
      ...calendarProps
    } = this.props;

    const className = `${baseClassName}__calendar`;

    return (
      <Fit>
        <div className={mergeClassNames(className, `${className}--${isCalendarOpen ? 'open' : 'closed'}`)}>
          <Calendar
            className={calendarClassName}
            onChange={this.onDateChange}
            selectRange
            value={value || null}
            {...calendarProps}
          />
        </div>
      </Fit>
    );
  }

  renderClock() {
    const { disableClock } = this.props;
    const { isClockOpen } = this.state;

    if (isClockOpen === null || disableClock) {
      return null;
    }

    const {
      clockClassName,
      className: dateTimeRangePickerClassName, // Unused, here to exclude it from clockProps
      maxDetail,
      onChange,
      value: dateTimeRangePickerValue,
      ...clockProps
    } = this.props;

    const className = `${baseClassName}__clock`;

    const maxDetailIndex = allViews.indexOf(maxDetail);

    const value = [].concat(dateTimeRangePickerValue)[0]; // TODO: Show clock for "date to" inputs

    return (
      <Fit>
        <div className={mergeClassNames(className, `${className}--${isClockOpen ? 'open' : 'closed'}`)}>
          <Clock
            className={clockClassName}
            renderMinuteHand={maxDetailIndex > 0}
            renderSecondHand={maxDetailIndex > 1}
            value={value}
            {...clockProps}
          />
        </div>
      </Fit>
    );
  }

  render() {
    const { className, disabled } = this.props;
    const { isCalendarOpen, isClockOpen } = this.state;

    return (
      <div
        className={mergeClassNames(
          baseClassName,
          `${baseClassName}--${isCalendarOpen || isClockOpen ? 'open' : 'closed'}`,
          `${baseClassName}--${disabled ? 'disabled' : 'enabled'}`,
          className,
        )}
        {...this.eventProps}
        onFocus={this.onFocus}
        ref={(ref) => {
          if (!ref) {
            return;
          }

          this.wrapper = ref;
        }}
      >
        {this.renderInputs()}
        {this.renderCalendar()}
        {this.renderClock()}
      </div>
    );
  }
}

const iconProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 19,
  height: 19,
  viewBox: '0 0 19 19',
  stroke: 'black',
  strokeWidth: 2,
};

const CalendarIcon = (
  <svg
    {...iconProps}
    className={`${baseClassName}__calendar-button__icon ${baseClassName}__button__icon`}
  >
    <rect width="15" height="15" x="2" y="2" fill="none" />
    <line x1="6" y1="0" x2="6" y2="4" />
    <line x1="13" y1="0" x2="13" y2="4" />
  </svg>
);

const ClearIcon = (
  <svg
    {...iconProps}
    className={`${baseClassName}__clear-button__icon ${baseClassName}__button__icon`}
  >
    <line x1="4" y1="4" x2="15" y2="15" />
    <line x1="15" y1="4" x2="4" y2="15" />
  </svg>
);

DateTimeRangePicker.defaultProps = {
  calendarIcon: CalendarIcon,
  clearIcon: ClearIcon,
  isCalendarOpen: null,
  isClockOpen: null,
  maxDetail: 'minute',
  name: 'datetimerange',
};

DateTimeRangePicker.propTypes = {
  amPmAriaLabel: PropTypes.string,
  calendarAriaLabel: PropTypes.string,
  calendarClassName: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  calendarIcon: PropTypes.node,
  className: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  clearAriaLabel: PropTypes.string,
  clearIcon: PropTypes.node,
  clockClassName: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  dayAriaLabel: PropTypes.string,
  disableClock: PropTypes.bool,
  disabled: PropTypes.bool,
  format: PropTypes.string,
  hourAriaLabel: PropTypes.string,
  isCalendarOpen: PropTypes.bool,
  isClockOpen: PropTypes.bool,
  locale: PropTypes.string,
  maxDate: isMaxDate,
  maxDetail: PropTypes.oneOf(allViews),
  minDate: isMinDate,
  minuteAriaLabel: PropTypes.string,
  monthAriaLabel: PropTypes.string,
  name: PropTypes.string,
  nativeInputAriaLabel: PropTypes.string,
  onCalendarClose: PropTypes.func,
  onCalendarOpen: PropTypes.func,
  onChange: PropTypes.func,
  onClockClose: PropTypes.func,
  onClockOpen: PropTypes.func,
  onFocus: PropTypes.func,
  required: PropTypes.bool,
  secondAriaLabel: PropTypes.string,
  showLeadingZeros: PropTypes.bool,
  yearAriaLabel: PropTypes.string,
};

polyfill(DateTimeRangePicker);
