import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import RPC from "../../services/solanaRPC";
import Loader from "../Loader";
import QRCode from "react-qr-code";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { format } from "date-fns";

type TicketManagerProps = {
  onClose: () => void;
  rpc: RPC | null;
};

const TicketManager = ({ onClose, rpc }: TicketManagerProps) => {
  type Ticket = {
    status: string | undefined;
    mintTimestamp: string;
    image: string | undefined;
    name: string;
    mint: string;
    expiration: number | undefined;
  };

  const [userTickets, setUserTickets] = useState<Ticket[] | undefined>([]);
  const [ticketPrice, setTicketPrice] = useState(0);
  const [loader, setLoader] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<Object>({});

  useEffect(() => {
    console.log("Fetching ticket data...");
    fetchTicketData(true);
  }, []);

  const fetchTicketData = async (init = false) => {
    setLoader(true);
    try {
      // const rpc = new RPC(provider);
      const [tickets, price] = await Promise.all([
        rpc?.getUserTickets(),
        rpc?.getPrice(),
      ]);
      if (tickets) {
        setUserTickets(tickets);
      }
      setTicketPrice(price || 0);
    } catch (err) {
      console.error("Failed to fetch ticket data:", err);
      toast.error("Failed to load ticket information", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      init && setLoader(false);
    }
  };

  const buyTicket = async () => {
    setLoader(true);
    try {
      //const rpc = new RPC(provider);
      const balance = await rpc?.getBalance();
      console.log("Balance:", balance, "Ticket Price:", ticketPrice);
      if (Number(balance) < ticketPrice) {
        toast.error("Insufficient funds", {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
        });
        throw new Error("Insufficient funds");
      }
      toast.loading("Minting ticket...", {
        theme: "dark",
        position: "top-right",
        autoClose: false,
      });
      await rpc?.CreateTicketNFT();

      await fetchTicketData(false);
      toast.dismiss();
      toast.success(`Ticket minted successfully!`, {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
      });
    } catch (error) {
      console.error("Error during Ticket minting:", error);
      toast.dismiss();
      toast.error("Error during Ticket minting", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoader(false);
    }
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(parseInt(timestamp));
    const mintTimestamp = format(date, "MMMM 'the' do, yyyy, h:mm a");
    return mintTimestamp;
  };

  const handleTicketClick = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
    try {
      //const rpc = new RPC(provider);
      const { status, expiration }: any = await rpc?.getTicketStatus(
        ticket.mint
      );
      setSelectedTicket((prevTicket) => ({
        ...prevTicket!,
        status,
        expiration,
      }));
    } catch (error) {
      console.error("Error fetching ticket status:", error);
      toast.error("Failed to fetch ticket status", {
        theme: "dark",
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const toggleTicketsDisplay = () => {
    setShowAllTickets(!showAllTickets);
  };

  const handleCloseQrModal = () => {
    setIsQrModalOpen(false);
    setQrData("");
  };

  const displayedTickets = showAllTickets
    ? userTickets
    : userTickets?.slice(0, 4);

  const TicketModal = ({
    ticket,
    onClose,
  }: {
    ticket: Ticket | null;
    onClose: () => void;
  }) => {
    if (!ticket) return null;

    const handleAskToActivate = () => {
      if (ticket.mint) {
        setQrData({ mintAddress: ticket.mint, timestamp: Date.now() });
        setIsQrModalOpen(true);
      } else {
        toast.error("Error generating QR code", {
          theme: "dark",
          position: "top-right",
          autoClose: 5000,
        });
      }
    };

    return (
      <div className="modalnft">
        <div className="modalContentNft">
          <img
            src={ticket?.image}
            alt={ticket?.name}
            style={{
              width: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              borderRadius: "10px",
              boxShadow: "0 0 5px 5px grey",
            }}
          />
          <h2>{ticket?.name}</h2>
          <p>Bought: {formatDate(ticket?.mintTimestamp)}</p>
          <p style={{ margin: "10px" }}>
            Status:{" "}
            <span
              style={{
                color:
                  ticket?.status === "Activated"
                    ? "green"
                    : ticket?.status === "Expired"
                    ? "red"
                    : "inherit",
                fontWeight: "bold",
              }}
            >
              {ticket?.status || "Loading..."}
            </span>
          </p>
          {ticket?.status === "Activated" && (
            <p style={{ marginBottom: "10px" }}>
              Expires:{" "}
              {ticket?.expiration
                ? new Date(ticket?.expiration * 1000).toLocaleString()
                : "Loading..."}
            </p>
          )}
          {ticket?.status === "Not activated" && (
            <button
              className="btnResult success"
              onClick={handleAskToActivate}
              disabled={ticket?.status !== "Not activated"}
            >
              Activate
            </button>
          )}
          <button className="btnResult" onClick={onClose}>
            Close
          </button>
        </div>
        {isQrModalOpen && (
          <div className="qr-code-container">
            <QRCode value={JSON.stringify(qrData)} />
            <button
              className="btnSubmit"
              type="button"
              style={{ marginTop: "30px" }}
              onClick={handleCloseQrModal}
            >
              Close or Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modalnft">
      <div className="modalContentNft">
        <h1
          className="modalContentNft"
          style={{
            fontFamily: "Final Frontier",
            fontSize: "1.5rem",
            margin: "0 auto",
          }}
        >
          Tickets Manager
        </h1>
        {loader ? (
          <Loader
            loadingMsg="Incoming subspace transmission..."
            styling={undefined}
          />
        ) : (
          <>
            <h2 style={{ margin: "20px", color: "orangered" }}>
              Price: {ticketPrice / LAMPORTS_PER_SOL} SOL
            </h2>
            <button
              className="btnResult success"
              onClick={buyTicket}
              style={{ marginBottom: "20px" }}
            >
              Buy Ticket
            </button>
            <hr />
            <h3>Your Tickets:</h3>
            <div className="rewardsContainer">
              {displayedTickets &&
                displayedTickets
                  // sort by date
                  .sort(
                    (a, b) =>
                      parseInt(b.mintTimestamp) - parseInt(a.mintTimestamp)
                  )
                  .map((ticket, index) => (
                    <div
                      key={index}
                      className="rewardItem"
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <img
                        src={ticket?.image}
                        alt={ticket?.name}
                        className="rewardImage"
                        style={{
                          width: "100%",
                          height: "auto",
                          borderRadius: "10px",
                          marginBottom: "10px",
                          cursor: "pointer",
                        }}
                      />
                      <h3>{formatDate(ticket?.mintTimestamp)}</h3>
                    </div>
                  ))}
            </div>
            {userTickets && userTickets.length > 4 && (
              <button className="btnSubmit" onClick={toggleTicketsDisplay}>
                {showAllTickets ? "Show Less" : "Show More"}
              </button>
            )}
            {userTickets && userTickets.length === 0 && (
              <p>You don't have any tickets yet.</p>
            )}
          </>
        )}
        <button
          className="btnResult"
          onClick={onClose}
          style={{ marginTop: "20px" }}
        >
          Close
        </button>
      </div>
      {isModalOpen && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
};

export default TicketManager;
