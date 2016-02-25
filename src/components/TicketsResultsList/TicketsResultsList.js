import React, { PropTypes } from 'react';
import styles from './TicketsResultsList.scss';
import withStyles from '../../decorators/withStyles';
import withViewport from '../../decorators/withViewport';

import ReactList from 'react-list';
import TicketCard from '../TicketCard';
import PriceCard from '../PriceCard'

@withViewport
@withStyles(styles) class TicketsResultsList extends React.Component {
    constructor(props) {
        super(props);
    }

    chooseTicket(ticket) {
        //если передан эвент - тригерим выбор
        if (this.props.events.chooseTicket) {
            this.props.events.chooseTicket(ticket);
        }
    }

    renderItem(ix, key) {
        var data = this.props.data;
        if (data) {
            var avia = data[ix];
            return (
                <div key={key} className="b-avia-list-item">
                    <span className="b-avia-list-item__index">{ix}</span>
                    <div className="b-avia-list-item__hotel">
                        <TicketCard data={avia}/>
                    </div>
                    <div className="b-avia-list-item__price">
                        <PriceCard
                            onChoose={() => this.chooseTicket(avia)}
                            data={{PackagePrice: avia.PackagePrice, CostPerPerson: avia.CostPerPerson}} chooseMode={true} />
                    </div>
                </div>
            )
        }

        return null;
    }

    render() {
        var data = this.props.data;
        if (data) {
            return (
                <div className="b-avia-list">
                    <div className="b-avia-list__items">
                        <ReactList
                            itemRenderer={this.renderItem.bind(this)}
                            length={data.length}
                            />
                    </div>
                </div>
            );
        }else{
            return null;
        }
    }

}

export default TicketsResultsList;
