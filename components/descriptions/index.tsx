import * as React from 'react';
import classNames from 'classnames';
import warning from '../_util/warning';
import ResponsiveObserve, {
  Breakpoint,
  BreakpointMap,
  responsiveArray,
} from '../_util/responsiveObserve';
import { ConfigConsumer, ConfigConsumerProps } from '../config-provider';

export interface DescriptionsItemProps {
  prefixCls?: string;
  label: React.ReactNode;
  span?: number;
  children?: React.ReactNode;
}

const DescriptionsItem: React.FC<DescriptionsItemProps> = ({ children }) => <span>{children}</span>;

export interface DescriptionsProps {
  prefixCls?: string;
  className?: string;
  style?: React.CSSProperties;
  bordered?: boolean;
  size?: 'middle' | 'small' | 'default';
  children?: React.ReactNode;
  title?: string;
  column?: number | Partial<Record<Breakpoint, number>>;
}

/**
 * Convert children into `column` groups.
 * @param cloneChildren: DescriptionsItem
 * @param column: number
 */
const generateChildrenRows = (
  cloneChildren: React.ReactNode,
  column: number,
): React.FunctionComponentElement<DescriptionsItemProps>[][] => {
  const childrenArray: React.FunctionComponentElement<DescriptionsItemProps>[][] = [];
  let columnArray: React.FunctionComponentElement<DescriptionsItemProps>[] = [];
  let totalRowSpan = 0;
  React.Children.forEach(
    cloneChildren,
    (node: React.FunctionComponentElement<DescriptionsItemProps>) => {
      columnArray.push(node);
      if (node.props.span) {
        totalRowSpan += node.props.span;
      } else {
        totalRowSpan += 1;
      }
      if (totalRowSpan >= column) {
        warning(
          totalRowSpan <= column,
          'Descriptions',
          'Sum of column `span` in a line exceeds `column` of Descriptions.',
        );

        childrenArray.push(columnArray);
        columnArray = [];
        totalRowSpan = 0;
      }
    },
  );
  if (columnArray.length > 0) {
    childrenArray.push(columnArray);
    columnArray = [];
  }
  return childrenArray;
};

/**
 * This code is for handling react15 does not support returning an array,
 * It can convert a children into two td
 * @param child DescriptionsItem
 * @returns
 * <>
 *   <td>{DescriptionsItem.label}</td>
 *   <td>{DescriptionsItem.children}</td>
 * </>
 */
const renderCol = (
  child: React.FunctionComponentElement<DescriptionsItemProps>,
  bordered: boolean,
) => {
  const { prefixCls, label, children, span = 1 } = child.props;
  if (bordered) {
    return [
      <td className={`${prefixCls}-item-label`} key="label">
        {label}
      </td>,
      <td className={`${prefixCls}-item-content`} key="content" colSpan={span * 2 - 1}>
        {children}
      </td>,
    ];
  }
  return (
    <td colSpan={span} className={`${prefixCls}-item`}>
      <span className={`${prefixCls}-item-label`} key="label">
        {label}
      </span>
      <span className={`${prefixCls}-item-content`} key="content">
        {children}
      </span>
    </td>
  );
};

const renderRow = (
  children: React.FunctionComponentElement<DescriptionsItemProps>[],
  index: number,
  { prefixCls, column, isLast }: { prefixCls: string; column: number; isLast: boolean },
  bordered: boolean,
) => {
  // copy children,prevent changes to incoming parameters
  const childrenArray = [...children];
  let lastChildren = childrenArray.pop();
  const span = column - childrenArray.length;
  if (isLast && lastChildren) {
    lastChildren = React.cloneElement(lastChildren, {
      span,
    });
  }
  const cloneChildren = React.Children.map(
    childrenArray,
    (childrenItem: React.FunctionComponentElement<DescriptionsItemProps>) => {
      return renderCol(childrenItem, bordered);
    },
  );
  return (
    <tr className={`${prefixCls}-row`} key={index}>
      {cloneChildren}
      {lastChildren && renderCol(lastChildren, bordered)}
    </tr>
  );
};

const defaultColumnMap = {
  xxl: 3,
  xl: 3,
  lg: 3,
  md: 3,
  sm: 2,
  xs: 1,
};

class Descriptions extends React.Component<
  DescriptionsProps,
  {
    screens: BreakpointMap;
  }
> {
  static defaultProps: DescriptionsProps = {
    size: 'default',
    column: defaultColumnMap,
  };

  static Item: typeof DescriptionsItem;

  state: {
    screens: BreakpointMap;
  } = {
    screens: {},
  };

  token: string;

  componentDidMount() {
    const { column } = this.props;
    this.token = ResponsiveObserve.subscribe(screens => {
      if (typeof column !== 'object') {
        return;
      }
      this.setState({
        screens,
      });
    });
  }

  componentWillUnmount() {
    ResponsiveObserve.unsubscribe(this.token);
  }

  getColumn(): number {
    const { screens = {} } = this.state;
    const { column } = this.props;
    if (typeof column === 'object') {
      for (let i = 0; i < responsiveArray.length; i = +1) {
        const breakpoint: Breakpoint = responsiveArray[i];
        if (screens[breakpoint] && column[breakpoint] !== undefined) {
          return column[breakpoint] || defaultColumnMap[breakpoint];
        }
      }
    }
    // If the configuration is not an object, it is a number, return number
    if (typeof column === 'number') {
      return column;
    }
    // If it is an object, but no response is found, this happens only in the test.
    // Maybe there are some strange environments
    return 3;
  }

  render() {
    return (
      <ConfigConsumer>
        {({ getPrefixCls }: ConfigConsumerProps) => {
          const {
            className,
            prefixCls: customizePrefixCls,
            title,
            size = 'default',
            children,
            bordered = false,
          } = this.props;
          const prefixCls = getPrefixCls('descriptions', customizePrefixCls);

          const column = this.getColumn();
          const cloneChildren = React.Children.map(
            children,
            (child: React.ReactElement<DescriptionsItemProps>) => {
              return React.cloneElement(child, {
                prefixCls,
              });
            },
          );

          const childrenArray: Array<
            React.FunctionComponentElement<DescriptionsItemProps>[]
          > = generateChildrenRows(cloneChildren, column);
          return (
            <div
              className={classNames(prefixCls, className, {
                [size]: size !== 'default',
                bordered,
              })}
            >
              {title && <div className={`${prefixCls}-title`}>{title}</div>}
              <div className={`${prefixCls}-view`}>
                <table style={bordered ? {} : { tableLayout: 'fixed' }}>
                  <tbody>
                    {childrenArray.map((child, index) =>
                      renderRow(
                        child,
                        index,
                        {
                          prefixCls,
                          column,
                          isLast: index + 1 === childrenArray.length,
                        },
                        bordered,
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }}
      </ConfigConsumer>
    );
  }
}

Descriptions.Item = DescriptionsItem;

export default Descriptions;
