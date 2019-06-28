import React from 'react';

const ui = item => {
  let description = item.displayProperties.description !== '' ? item.displayProperties.description : false;

  return (
    <>
      {description ? (
        <div className='description'>
          <pre>{description}</pre>
        </div>
      ) : null}
    </>
  );
};

export default ui;
