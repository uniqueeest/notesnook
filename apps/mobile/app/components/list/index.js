/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React, { useRef } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { notesnook } from "../../../e2e/test.ids";
import { eSendEvent } from "../../services/event-manager";
import Sync from "../../services/sync";
import { useThemeStore } from "../../stores/use-theme-store";
import { db } from "../../common/database";
import { eScrollEvent } from "../../utils/events";
import { tabBarRef } from "../../utils/global-refs";
import JumpToSectionDialog from "../dialogs/jump-to-section";
import { Footer } from "../list-items/footer";
import { Header } from "../list-items/headers/header";
import { SectionHeader } from "../list-items/headers/section-header";
import { NoteWrapper } from "../list-items/note/wrapper";
import { NotebookWrapper } from "../list-items/notebook/wrapper";
import TagItem from "../list-items/tag";
import { Empty } from "./empty";

const renderItems = {
  note: NoteWrapper,
  notebook: NotebookWrapper,
  topic: NotebookWrapper,
  tag: TagItem,
  section: SectionHeader,
  header: SectionHeader
};

const RenderItem = ({ item, index, type, ...restArgs }) => {
  if (!item) return <View />;
  const Item = renderItems[item.itemType || item.type] || View;
  const groupOptions = db.settings?.getGroupOptions(type);
  const dateBy =
    groupOptions.sortBy !== "title" ? groupOptions.sortBy : "dateEdited";

  const tags =
    item.tags
      ?.slice(0, 3)
      ?.map((item) => {
        let tag = db.tags.tag(item);

        if (!tag) return null;
        return {
          title: tag.title,
          id: tag.id,
          alias: tag.alias
        };
      })
      .filter((t) => t !== null) || [];
  return (
    <Item
      item={item}
      tags={tags}
      dateBy={dateBy}
      index={index}
      type={type}
      {...restArgs}
    />
  );
};

const List = ({
  listData,
  type,
  refreshCallback,
  placeholderData,
  loading,
  headerProps = {
    heading: "Home",
    color: null
  },
  screen,
  ListHeader,
  warning
}) => {
  const colors = useThemeStore((state) => state.colors);
  const scrollRef = useRef();

  const renderItem = React.useCallback(
    ({ item, index }) => (
      <RenderItem
        item={item}
        index={index}
        color={headerProps.color}
        title={headerProps.heading}
        type={screen === "Notes" ? "home" : type}
        screen={screen}
      />
    ),
    [headerProps.color, headerProps.heading, screen, type]
  );

  const _onRefresh = async () => {
    Sync.run("global", false, true, () => {
      if (refreshCallback) {
        refreshCallback();
      }
    });
  };

  const _onScroll = React.useCallback(
    (event) => {
      if (!event) return;
      let y = event.nativeEvent.contentOffset.y;
      eSendEvent(eScrollEvent, {
        y,
        screen
      });
    },
    [screen]
  );

  let styles = {
    width: "100%",
    minHeight: 1,
    minWidth: 1
  };

  const _keyExtractor = (item) => item.id || item.title;

  return (
    <>
      <Animated.View
        style={{
          flex: 1
        }}
        entering={type === "search" ? undefined : FadeInDown}
      >
        <FlatList
          style={styles}
          keyExtractor={_keyExtractor}
          ref={scrollRef}
          testID={notesnook.list.id}
          data={listData}
          renderItem={renderItem}
          onScroll={_onScroll}
          windowSize={5}
          onMomentumScrollEnd={() => {
            tabBarRef.current?.unlock();
          }}
          directionalLockEnabled={true}
          initialNumToRender={10}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          refreshControl={
            <RefreshControl
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.nav}
              onRefresh={_onRefresh}
              refreshing={false}
            />
          }
          ListEmptyComponent={
            <Empty
              loading={loading}
              placeholderData={placeholderData}
              headerProps={headerProps}
              type={type}
              screen={screen}
            />
          }
          ListFooterComponent={<Footer />}
          ListHeaderComponent={
            <>
              {ListHeader ? (
                ListHeader
              ) : (
                <Header
                  title={headerProps.heading}
                  color={headerProps.color}
                  type={type}
                  screen={screen}
                  warning={warning}
                />
              )}
            </>
          }
        />
      </Animated.View>
      <JumpToSectionDialog
        screen={screen}
        data={listData}
        type={screen === "Notes" ? "home" : type}
        scrollRef={scrollRef}
      />
    </>
  );
};

export default List;