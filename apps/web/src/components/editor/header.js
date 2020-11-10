import React from "react";
import "./editor.css";
import { Flex } from "rebass";
import TitleBox from "./title-box";
import { useStore, SESSION_STATES } from "../../stores/editor-store";

function Header() {
  const title = useStore((store) => store.session.title);

  const sessionState = useStore((store) => store.session.state);
  const setSession = useStore((store) => store.setSession);

  return (
    <Flex justifyContent="center">
      <TitleBox
        shouldFocus={sessionState === SESSION_STATES.new}
        title={title}
        changeInterval={500}
        setTitle={(title) =>
          setSession((state) => {
            state.session.title = title;
          })
        }
      />
    </Flex>
  );
}
export default Header;
