/*! React Starter Kit | MIT License | http://www.reactstarterkit.com/ */

import React, { PropTypes } from 'react';
import styles from './PackagesSearchResultsPage.scss';
import withStyles from '../../decorators/withStyles';
import withViewport from '../../decorators/withViewport';
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import Location from '../../core/Location';
import { setSearchParams, setSearchParam } from '../../core/LocationHelper';

//api
import api from './../../core/ApiClient';
import apiUrls from './../../constants/ApiUrls.js';

//helpers
import { routeDateToApiDate } from '../../core/DateHelper.js'

//controls
import { WaitMsg } from '../ui/PopupMessages';
import SearchForm from '../SearchForm';
import RecommendedBundle from '../RecommendedBundle';
import { PackagesFilters, AviaFilters } from '../ListFilters';
import { MobileSelectedFilter } from '../MobileFilters';
import PackagesResultsList from '../PackagesResultsList';
import AviaResultsList from '../AviaResultsList';
import PackagesListInfoBlock from '../PackagesListInfoBlock';

import ListType from './ListType.js';
import DisplayEnum from './DisplayEnum.js';

@withViewport
@withStyles(styles) class PackagesSearchResultsPage extends React.Component {
    static contextTypes = {
        onSetTitle: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);

        let data = props.data;
        let routeParams = props.routeParams;

        //данные для формы
        this.formData = {
            from: data[0],
            to: data[1],
            ...routeParams
        };

        //берем из location.hash
        this.state = {
            hotelsData: null,
            ticketsData: null,
            
            //тип списка - отели или билеты
            listType: this.getListTypeFromProps(props),
            
            //из урла, или рекомендованный - текущая страница (для мобильной), реком. вар., список отелей или список билетов
            display: props.routeQuery.display || DisplayEnum.Recommended,
            
            //error: true
        };

        //console.log('init, state:', this.state);
    }

    componentWillReceiveProps(props) {
        //this.props на данном этапе имеет предыдущее значение !!!
        //props - новые свойства, которые получит контрол
        //console.log('componentWillReceiveProps', JSON.stringify(props.routeQuery), JSON.stringify(this.props.routeQuery));

        //флаги соответствия состояния и урла
        this.setState({
            listType: this.getListTypeFromProps(props),
            display: props.routeQuery.display,
        });
    }

    getListTypeFromProps(props) {
        return props.routeQuery.display == ListType.Tickets ? ListType.Tickets : ListType.Hotels;
    }

    getData() {
        return new Promise((resolve, reject)=> {
            let fromDateApi = routeDateToApiDate(this.props.routeParams.fromDate);
            let toDateApi = routeDateToApiDate(this.props.routeParams.toDate);
            let routeParams = this.props.routeParams;

            let params = {
                AddFilter: 'true',
                Adult: routeParams.adultCount,
                ArrivalId: routeParams.toId,
                DepartureId: routeParams.fromId,
                EndVoyageDate: toDateApi,
                StartVoyageDate: fromDateApi,
                TicketClass: routeParams.flightClass
            };

            api.cachedGet(apiUrls.PackagesSearchHotels, params).then((data)=> {
                //console.log('SearchHotels data', data);

                if (data) {
                    let recPair = data.RecommendedPair;
                    //добавляем доп поля для карточки авиа и отеля
                    recPair.AviaInfo.CurrentListType = this.state.listType;
                    recPair.Hotel.CurrentListType = this.state.listType;
                    recPair.Hotel.HotelsCount = data.HotelCount;

                    this.setState({
                        hotelsData: data.Hotels,
                        recommendedData: recPair
                    });
                    resolve(data);
                }
                else {
                    console.error('PackagesSearchHotels data is null');
                    this.setState({
                        error: true
                    });
                    reject();
                }
            });
        });
    }

    getAviaData() {
        let fromDateApi = routeDateToApiDate(this.props.routeParams.fromDate);
        let toDateApi = routeDateToApiDate(this.props.routeParams.toDate);
        let routeParams = this.props.routeParams;

        let params = {
            AddFilter: 'true',
            Adult: routeParams.adultCount,
            ArrivalId: routeParams.toId,
            DepartureId: routeParams.fromId,
            EndVoyageDate: toDateApi,
            StartVoyageDate: fromDateApi,
            TicketClass: routeParams.flightClass,
            HotelId: this.state.recommendedData.Hotel.HotelId,
            TicketId: this.state.recommendedData.AviaInfo.VariantId1
        };

        api.cachedGet(apiUrls.PackagesSearchTickets, params).then((data)=> {
            //console.log('SearchTickets data', data);

            if (data) {
                //добавляем доп поля для карточки авиа
                var recPair = this.state.recommendedData;
                recPair.AviaInfo.TicketsCount = data.AviaInfos.length;
                this.setState({
                    ticketsData: data.AviaInfos,
                    recommendedData: recPair
                });
            }
            else {
                console.error('SearchTickets data is null');
                this.setState({
                    error: true
                });
            }
        });
    }

    setQueryString() {
        //если первый запрос, и не сохранили реком. отель и билет
        var query = this.props.routeQuery;
        if (!query.hotel || !query.ticket) {
            var pair = this.state.recommendedData;

            //проставляем в урл
            setSearchParams([
                ['hotel', pair.Hotel.HotelId],
                ['ticket', pair.AviaInfo.VariantId1],
                ['display', DisplayEnum.Recommended]
            ]);
        }
        else if (!query.display) {
            //проставляем в урл
            setSearchParam('display', DisplayEnum.Recommended);
        }
    }

    componentDidMount() {
        this.getData().then(()=> {
            //проставляем ссылки на рек вариант
            this.setQueryString();

            //сразу запрашиваем данные по перелетам
            this.getAviaData();
        });
    }

    changeListType(type) {
        //переключаем список перелетов / пакетов
        var pair = this.state.recommendedData;
        if (pair) {
            pair.AviaInfo.CurrentListType = type;
            pair.Hotel.CurrentListType = type;
        }

        this.setState({
            recommendedData: pair,
        });

        //меняем параметры в урле через history api
        var stateDisplay = type == ListType.Hotels ? DisplayEnum.Hotels : DisplayEnum.Tickets;
        setSearchParams([
            ['hotel', pair.Hotel.HotelId],
            ['ticket', pair.AviaInfo.VariantId1],
            ['display', stateDisplay]
        ]);
    }

    chooseHotel(hotel) {
        //меняем параметры в урле через history api
        setSearchParam('hotel', hotel.HotelId);
    }

    chooseTicket(ticket) {
        //меняем параметры в урле через history api
        setSearchParam('ticket', ticket.VariantId1);
    }

    renderOverlay() {
        if (this.state.hotelsData == null) {
            return (
                <WaitMsg
                    data={{title:'Ищем варианты', text:'Поиск займет не более 30 секунд', cancelText:'Прервать поиск'}}
                    close={()=>{
                        alert('popup close')
                    }}
                    cancel={()=>{
                        alert('popup cancel')
                    }}
                    />
            );
        }
        //else if (this.state.error) {
        //    return (
        //        <PopupMessage data={{title:'Произошла ошибка', text:'Пожалуйста позвоните нам'}} />
        //    );
        //}

        return null;
    }

    render() {
        let title = 'Инна-Тур - Динамические пакеты';
        this.context.onSetTitle(title);

        let events = {
            changeListType: this.changeListType.bind(this),
            chooseHotel: this.chooseHotel.bind(this),
            chooseTicket: this.chooseTicket.bind(this)
        };

        return (
            <section className="b-packages-results-page">
                {this.renderOverlay()}
                <div className="b-packages-results-page__form">
                    <SearchForm data={this.formData}/>
                </div>
                <div className="b-packages-results-page__mobile-filter">
                    <MobileSelectedFilter listType={this.state.listType}/>
                </div>
                {
                    //на мобиле скрываем когда на списке отелей или билетов
                    this.props.viewport.isMobile && this.state.display != DisplayEnum.Recommended ? null :
                        <div id="recommended"
                             className="b-packages-results-page__recommended-bundle">
                            <div className="b-recommended-bundle-bg">
                            </div>
                            <RecommendedBundle
                                events={events}
                                data={this.state.recommendedData}
                                />
                        </div>
                }
                <div className="b-packages-results-page__filter">
                    {this.state.listType == ListType.Hotels ? <PackagesFilters /> : <AviaFilters />}
                </div>
                {
                    //на мобиле список показываем, когда не на рекомендуемом
                    this.props.viewport.isMobile && this.state.display == DisplayEnum.Recommended ? null :
                        <div className="b-packages-results-page__results">
                            <div className="b-packages-results">
                                <div className="b-packages-results__content">
                                    {
                                        this.state.listType == ListType.Hotels ?
                                            <PackagesResultsList
                                                events={events}
                                                data={this.state.hotelsData}/> :
                                            <AviaResultsList
                                                events={events}
                                                data={this.state.ticketsData}/>
                                    }
                                </div>
                                {
                                    (this.state.listType == ListType.Hotels) ?
                                        <div className="b-packages-results__info-block">
                                            <PackagesListInfoBlock data={this.state.hotelsData}/>
                                        </div> :
                                        null
                                }
                            </div>
                        </div>
                }
            </section>
        );
    }
}

export default PackagesSearchResultsPage;
