import React from 'react';
import Icon from '../../components/shared/Icon';

export const CATEGORY_ICONS = {
    grid: (props) => <Icon name="grid" {...props} />,
    home: (props) => <Icon name="home" {...props} />,
    soup: (props) => <Icon name="soup" {...props} />,
    flame: (props) => <Icon name="flame" {...props} />,
    box: (props) => <Icon name="package" {...props} />,
    drink: (props) => <Icon name="drink" {...props} />,
    table: (props) => <Icon name="table" {...props} />,
    coffee: (props) => <Icon name="coffee" {...props} />,
    pizza: (props) => <Icon name="pizza" {...props} />,
    meat: (props) => <Icon name="meat" {...props} />,
    leaf: (props) => <Icon name="leaf" {...props} />,
    fish: (props) => <Icon name="fish" {...props} />,
    dessert: (props) => <Icon name="dessert" {...props} />,
    wine: (props) => <Icon name="wine" {...props} />,
    beer: (props) => <Icon name="beer" {...props} />,
    utensils: (props) => <Icon name="utensils" {...props} />
};

export const DEFAULT_ICON = 'grid';

export const getIcon = (name, props = {}) => {
    const IconComponent = CATEGORY_ICONS[name] || CATEGORY_ICONS[DEFAULT_ICON];
    return IconComponent(props);
};
