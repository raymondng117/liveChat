
import {useState, useEffect} from "react"
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
//npm install socket.io-client
import io from "socket.io-client";


const currentHostIp = window.location.hostname;

//allow this page (http://192.168.0.93:3000) gain access to the server page (http://192.168.0.93:8080) and its routes to retrieve data from server-cllient
const socket = io(`http://${currentHostIp}:8080`);



//used to send post request once the "send" button is clicked
async function postMessage({ message }) {
  try {
    await fetch(`http://${currentHostIp}:8080/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    socket.emit("message", message);
  } catch (error) {
    console.error("Error posting message:", error);
  }
}

//used to delete data once the "delete button" is clicked
async function deleteMessages() {
  try {
    await fetch(`http://${currentHostIp}:8080/delete`, {
      method: "POST",
    });
    socket.emit("delete");
  } catch (error) {
    console.error("Error deleting messages:", error);
  }
}

function DisplayMessage({ name, message }) {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Card.Title>{name}</Card.Title>
        <Card.Text>{message}</Card.Text>
      </Card.Body>
    </Card>
  );
}

//render the messages
//** new hook must be starting with uppercase*/
// a component is a function that you have to retun a JSX (retunr (....))
function MessageList() {

  // create an array for its different state by using useState
  const [messages, setMessages] = useState([]);

  // using get method to send get request to the server page "http://host:8080/messages" to retrieve data
  async function getMessages() {
    try {
      const response = await fetch(`http://${currentHostIp}:8080/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }
  
  // 
  useEffect(() => { getMessages() }, []);

  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleMessagesDeleted = () => {
      setMessages([]);
    };

    socket.on("message", handleNewMessage);
    socket.on("messagesDeleted", handleMessagesDeleted);

    return () => {
      socket.off("message", handleNewMessage);
      socket.off("messagesDeleted", handleMessagesDeleted);
    };
  }, []);

  return (
    <>
      {messages.map((msg, index) => (
        <DisplayMessage key={index} name={msg.name} message={msg.message} />
      ))}
    </>
  );
}


function App() {

  const [message, setMessage] = useState("");
  
  const submit = (e) => {
    e.preventDefault();
    const newMessage = { name, message };
    postMessage({ message: newMessage });
    setMessage("");
  };

  const [name, setName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteMessages();
    setIsDeleting(false);
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col xs={12} md={6}>
          <Card className="my-4">
            <Card.Body>
              <Form onSubmit={submit}>
                <Form.Group controlId="name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Form.Group>
                <Form.Group controlId="message">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </Form.Group> <br/>
                <Button variant="primary" type="submit">
                  Send
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="ml-2"
                >
                  {isDeleting ? "Deleting..." : "Delete Data"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <MessageList />
        </Col>
      </Row>
    </Container>
  );
}

export default App;