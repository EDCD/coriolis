import React from 'react';
import useMeasure from 'react-use-measure';

const ResponsiveWrapper = ({ children }) => {
  const [ref, bounds] = useMeasure();

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', minHeight: '200px' }}>
      {bounds.width > 0 && children(bounds)}
    </div>
  );
};

export default ResponsiveWrapper;