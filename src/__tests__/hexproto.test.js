/* global test, expect */

const hexproto = require("../hexprotocol");

//
// buildHexCommand tests

test("get power state", () => {
  const expected =
    "\x01\x30\x41\x30\x41\x30\x36\x02\x30\x31\x44\x36\x03\x74\x0d";
  expect(hexproto.buildHexCommand(hexproto.MSGTYPE.CMD, "01D6")).toBe(expected);
});

test("get input state", () => {
  const expected =
    "\x01\x30\x41\x30\x43\x30\x36\x02\x30\x30\x36\x30\x03\x03\x0d";
  expect(hexproto.buildHexCommand(hexproto.MSGTYPE.GET_PARAM, "0060")).toBe(
    expected,
  );
});

test("get volume level", () => {
  const expected =
    "\x01\x30\x41\x30\x43\x30\x36\x02\x30\x30\x36\x32\x03\x01\x0d";
  expect(hexproto.buildHexCommand(hexproto.MSGTYPE.GET_PARAM, "0062")).toBe(
    expected,
  );
});

//
// parseData tests

test("parse power state", () => {
  const data = Buffer.from(
    "\x01\x30\x30\x41\x42\x31\x32\x02\x30\x32\x30\x30\x44\x36\x30\x30\x30\x30\x30\x34\x30\x30\x30\x34\x03\x71\x0d",
  );
  expect(hexproto.parseData(data)).toEqual({
    msgType: "\x42",
    payload: [
      "30",
      "32",
      "30",
      "30",
      "44",
      "36",
      "30",
      "30",
      "30",
      "30",
      "30",
      "34",
      "30",
      "30",
      "30",
      "34",
    ],
  });
});

//
// parseGetSetParamReply tests

test("parse input state", () => {
  const data = Buffer.from(
    "\x01\x30\x30\x41\x44\x31\x32\x02\x30\x30\x30\x30\x36\x30\x30\x30\x30\x30\x31\x31\x30\x30\x30\x33\x03\x02\x0d",
  );

  const response = hexproto.parseData(data);
  expect(response).toEqual({
    msgType: "\x44",
    payload: [
      "30",
      "30",
      "30",
      "30",
      "36",
      "30",
      "30",
      "30",
      "30",
      "30",
      "31",
      "31",
      "30",
      "30",
      "30",
      "33",
    ],
  });

  expect(hexproto.parseGetSetParamReply(response.payload)).toEqual({
    success: true,
    opPage: "00",
    opCode: "60",
    value: 3,
  });
});
