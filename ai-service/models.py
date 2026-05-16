from sqlalchemy import Boolean, Column, DateTime, Double, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from database import Base


class Airport(Base):
    __tablename__ = "Airports"

    Id = Column(Integer, primary_key=True)
    IcaoCode = Column(String(10), nullable=False, unique=True)
    IataCode = Column(String(3), nullable=True)
    Name = Column(String, nullable=False)
    City = Column(String, default="")
    Country = Column(String, default="")
    Latitude = Column(Double)
    Longitude = Column(Double)

    DepartingFlights = relationship(
        "Flight",
        foreign_keys="Flight.DepartureAirportId",
        back_populates="DepartureAirport",
    )
    ArrivingFlights = relationship(
        "Flight",
        foreign_keys="Flight.ArrivalAirportId",
        back_populates="ArrivalAirport",
    )


class Airline(Base):
    __tablename__ = "Airlines"

    Id = Column(Integer, primary_key=True)
    IcaoCode = Column(String, default="")
    Name = Column(String, default="")
    BaseFareModifier = Column(Numeric, default=1.0)
    EcoRating = Column(Double)

    Flights = relationship("Flight", back_populates="AirlineEntity")


class Flight(Base):
    __tablename__ = "Flights"

    Id = Column(Integer, primary_key=True)
    FlightNumber = Column(String, nullable=False)
    # "Airline" is the legacy string column in DB; mapped to AirlineName to avoid
    # clashing with the AirlineEntity relationship below.
    AirlineName = Column("Airline", String, nullable=True)
    AirlineId = Column(Integer, ForeignKey("Airlines.Id"), nullable=True)
    DepartureAirportId = Column(Integer, ForeignKey("Airports.Id"), nullable=False)
    ArrivalAirportId = Column(Integer, ForeignKey("Airports.Id"), nullable=False)
    DepartureTime = Column(DateTime)
    ArrivalTime = Column(DateTime)
    Price = Column(Numeric)
    LastUpdated = Column(DateTime)

    AirlineEntity = relationship("Airline", back_populates="Flights")
    DepartureAirport = relationship(
        "Airport",
        foreign_keys=[DepartureAirportId],
        back_populates="DepartingFlights",
    )
    ArrivalAirport = relationship(
        "Airport",
        foreign_keys=[ArrivalAirportId],
        back_populates="ArrivingFlights",
    )
    Analytics = relationship("FlightAnalytics", back_populates="Flight", uselist=False)
    Bookings = relationship("Booking", back_populates="Flight")


class FlightAnalytics(Base):
    __tablename__ = "FlightAnalytics"

    FlightId = Column(Integer, ForeignKey("Flights.Id"), primary_key=True)
    BasePrice = Column(Numeric)
    DelayProbability = Column(Double)
    PredictedDelayMinutes = Column(Integer)
    Co2Emissions = Column(Double)
    FuelEfficiency = Column(Double)
    SmartScore = Column(Double)
    IsEcoFriendly = Column(Boolean)
    IsBestValue = Column(Boolean)

    Flight = relationship("Flight", back_populates="Analytics")


class User(Base):
    __tablename__ = "Users"

    Id = Column(Integer, primary_key=True)
    Email = Column(String, nullable=False, unique=True)
    PasswordHash = Column(String, nullable=False)
    FirstName = Column(String, nullable=False)
    LastName = Column(String, nullable=False)
    Age = Column(Integer)
    CreatedAt = Column(DateTime)

    Bookings = relationship("Booking", back_populates="User")
    Following = relationship(
        "UserFollow",
        foreign_keys="UserFollow.FollowerId",
        back_populates="Follower",
    )
    Followers = relationship(
        "UserFollow",
        foreign_keys="UserFollow.FolloweeId",
        back_populates="Followee",
    )


class Booking(Base):
    __tablename__ = "Bookings"

    Id = Column(Integer, primary_key=True)
    UserId = Column(Integer, ForeignKey("Users.Id"), nullable=False)
    FlightId = Column(Integer, ForeignKey("Flights.Id"), nullable=False)
    BookingDate = Column(DateTime)
    SeatNumber = Column(String, default="")
    ConfirmationCode = Column(String, default="")

    User = relationship("User", back_populates="Bookings")
    Flight = relationship("Flight", back_populates="Bookings")


class UserFollow(Base):
    __tablename__ = "UserFollows"

    FollowerId = Column(Integer, ForeignKey("Users.Id"), primary_key=True)
    FolloweeId = Column(Integer, ForeignKey("Users.Id"), primary_key=True)
    FollowedAt = Column(DateTime)

    Follower = relationship("User", foreign_keys=[FollowerId], back_populates="Following")
    Followee = relationship("User", foreign_keys=[FolloweeId], back_populates="Followers")
