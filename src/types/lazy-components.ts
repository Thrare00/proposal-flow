import React from 'react';

export type LazyComponent = React.LazyExoticComponent<React.ComponentType<any>>;

export type LazyComponentType = {
  default: React.ComponentType<any>;
};
