import React, { Component } from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import Home from './components/Home';
import CustomerList from './components/CustomerList';
import RentalList from './components/RentalList';
import SearchBar from './components/SearchBar';
import MovieLib from './components/MovieLib';
import Nav from './components/Nav';
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

const BASE_URL = 'http://localhost:3000'

class App extends Component {
  constructor() {
    super();

    this.state = {
      movies: [],
      selectedMovie: undefined,
      customers: [],
      rentals: [],
      selectedCustomer: undefined,
      selectedRental: undefined,
      error: undefined,
      alertText: undefined,
      alertVariant: undefined,
      detailsMovie: undefined,
    };
  } 

  componentDidMount() {
    axios.get(`${BASE_URL}/customers`)
    .then((response) => {
      const customers = response.data;
      this.setState({ 
        customers,
        error: undefined
      });
    })
    .catch((error) => {
      this.setState({ error: error.message });
    });

    axios.get(`${BASE_URL}/movies`)
    .then((response) => {
      const movies = response.data;
      this.setState({ 
        movies,
        error: undefined
      });
    })
    .catch((error) => {
      this.setState({ error: error.message });
    });

    axios.get(`${BASE_URL}/rentals`)
    .then((response) => {
      const rentals = response.data;
      this.setState({ 
        rentals,
        error: undefined
      });
    })
    .catch((error) => {
      this.setState({ error: error.message });
    });
  }

  addMovie = (movieToAdd) => {
    if (!this.state.movies.find(movie => movie.external_id === movieToAdd.external_id)) {
      axios.post(`${BASE_URL}/movies`, movieToAdd)
      .then((response) => {
        const { movies } = this.state;
        movies.push(movieToAdd)
        this.setState({
          movies,
          alertText: "Movie added to your rental library",
          alertVariant: "success"
        });
      })
      .catch((error) => {
        this.setState({ 
          error: error.message,
          alertText: `${error.message}`,
          alertVariant: "danger" 
        });
      });
    } else { 
      this.setState({
        alertText: "Movie cannot be added to the libaray, it already exists in library", 
        alertVariant: "danger"
      })
    }
  }

  selectMovie = (movieId) => {
    const { movies } = this.state;
    const selectedMovie = movies.find((movie) => {
      return movie.external_id === movieId;
    })
    
    this.setState({  selectedMovie })
  }

  selectCustomer(customerId) {
    const { customers } = this.state;
    const selectedCustomer = customers.find((customer) => {
      return customer.id === customerId;
    })

    this.setState({ selectedCustomer })
  }

  createRental() {
    if(this.state.selectedMovie) {
      const movieTitle = this.state.selectedMovie.title
      const customerId = this.state.selectedCustomer.id

      let dueDate = new Date()
      dueDate.setDate(new Date().getDate() + 1);

      const params = {
        customer_id: customerId,
        due_date: dueDate.toISOString(), 
      }

      axios.post(`${BASE_URL}/rentals/${movieTitle}/check-out`, params)
      .then(() => {
        this.setState({
          selectedMovie: undefined,
          selectedCustomer: undefined,
          error: undefined,
          alertText: "Rental successfully created",
          alertVariant: "success"
        })
      })
      .catch((error) => {
        this.setState({ 
          error: error.message,
          alertText: `An error occurred: ${error.message}`,
          alertVariant: "danger"
        });
      });
    }
  }

  returnRental(movie, customer) {
    const params = {
      customer_id: customer.id,
      movie_id: movie.id, 
    }

    axios.post(`${BASE_URL}/rentals/${movie.title}/return`, params)
    .then(() => {
      this.setState({
        selectedMovie: undefined,
        selectedCustomer: undefined,
        error: undefined,
        alertText: "Movie successfully rented",
        alertVariant: "success"
      })
    })
    .catch((error) => {
      this.setState({ 
        error: error.message,
        alertText: `An error occurred: ${error.message}`,
        alertVariant: "danger"
      });
    });
  }

  detailsCallback(movieId) {    
    const { movies, detailsMovie } = this.state;
    if (detailsMovie && detailsMovie.external_id === movieId) {
      this.setState({ detailsMovie: undefined })
    } else {
      const detailsMovie = movies.find((movie) => {
        return movie.external_id === movieId;
      })
      this.setState({ detailsMovie })
    }
  }
  
  selectedItemClass() {
    return ((this.state.selectedCustomer || this.state.selectedMovie) ? "items-selected" : "no-items-selected" )
  }

  render() {
    const videoAlert = () => {
      return(
        <Alert 
          variant={this.state.alertVariant}
          onClose={() => this.setState({alertText: undefined, alertVariant: undefined})} 
          dismissible
        > 
          {this.state.alertText} 
        </Alert>
      )
    }

    return (
      <Router>
        <Nav className="ml-auto"/>
        <div className={this.selectedItemClass()}>
          {this.state.selectedMovie ? ("Selected Movie: \n" + this.state.selectedMovie.title) : "" }
          <br />
          {this.state.selectedCustomer ? ("Selected Customer: \n" + this.state.selectedCustomer.name) : "" }
          <br />
          {(this.state.selectedMovie && this.state.selectedCustomer )? <Button onClick={() => this.createRental()}>Create a Rental</Button> : ''}
        </div>

        <div className="main">
          {this.state.alertText ? videoAlert() : "" }
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route path="/customers">
              <CustomerList 
              customerList={this.state.customers} 
              selectCustomer={(id) => this.selectCustomer(id)} />
            </Route>
            <Route path="/search">
              <SearchBar 
                url={BASE_URL} 
                selectMovie={(id) => this.addMovie(id)} 
                detailsCallback={(id) => this.detailsCallback(id)} 
                detailsMovie={this.state.detailsMovie} />
            </Route>
            <Route path="/library">
              <MovieLib 
                movieList={this.state.movies} 
                selectMovie={(id) => this.selectMovie(id)} 
                selectCustomer={(id) => this.selectCustomer(id)}
                detailsCallback={(id) => this.detailsCallback(id)} 
                detailsMovie={this.state.detailsMovie} />
            </Route>
            <Route path="/rentals">
              <RentalList 
              rentalList={this.state.rentals} 
              returnRental={(movie, customer) => this.returnRental(movie, customer)} />
            </Route>
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;